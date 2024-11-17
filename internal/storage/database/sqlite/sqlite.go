package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"

	_ "github.com/mattn/go-sqlite3"
)

type SQLite struct {
	File      string
	Timeout   time.Duration
	EnableWAL bool
	*sql.DB
}

var queries = sqlc.New()

func (sq *SQLite) Open() error {
	slog.Info("opening SQLite database at " + sq.File)

	journalMode := ""
	if sq.EnableWAL {
		journalMode = "&_journal_mode=wal"
	}

	connStr := fmt.Sprintf("%s?mode=rwc&cache=shared&_busy_timeout=%d&_foreign_keys=1&_txlock=immediate%s", sq.File, sq.Timeout.Milliseconds(), journalMode)

	db, err := sql.Open("sqlite3", connStr)
	if err != nil {
		return err
	}

	sq.DB = db

	return nil
}

func (sq *SQLite) Close() error {
	if sq.DB == nil {
		return nil
	}

	return sq.DB.Close()
}

func (sq *SQLite) Conn(ctx context.Context) database.Executor {
	tx, ok := txFromCtx(ctx)
	if !ok {
		return sq.DB
	}

	return tx
}

func (sq *SQLite) InTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	if _, ok := txFromCtx(ctx); ok {
		return fn(ctx)
	}

	tx, err := sq.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("error beginning transaction: %w", err)
	}

	ctx = ctxWithTx(ctx, tx)

	_, err = tx.ExecContext(ctx, "PRAGMA defer_foreign_keys = 1")
	if err != nil {
		err = fmt.Errorf("error setting foreign key check to deferred: %w", err)
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("error rolling back: %w. original error: %v", rbErr, err)
		}
		return err
	}

	if err := fn(ctx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("error rolling back: %w. original error: %v", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %w", err)
	}

	return nil
}

type ctxTxKeyType string

const ctxTxKey = ctxTxKeyType("ctxTxKey")

func txFromCtx(ctx context.Context) (*sql.Tx, bool) {
	tx, ok := ctx.Value(ctxTxKey).(*sql.Tx)
	return tx, ok
}

func ctxWithTx(parent context.Context, tx *sql.Tx) context.Context {
	return context.WithValue(parent, ctxTxKey, tx)
}
