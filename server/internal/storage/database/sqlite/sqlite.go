package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"go.robinthrift.com/belt/internal/storage/database"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/sqlc"

	_ "modernc.org/sqlite"
)

type SQLite struct {
	File         string
	Timeout      time.Duration
	EnableWAL    bool
	DebugEnabled bool
	*sql.DB
}

var queries = sqlc.New()

func (sq *SQLite) Open() error {
	slog.Info("opening SQLite database at " + sq.File)

	journalMode := ""
	if sq.EnableWAL {
		journalMode = "&_pragma=journal_mode(wal)"
	}

	connStr := fmt.Sprintf("%s?_pragma=busy_timeout(%d)&_pragma=foreign_keys(1)&_txlock=immediate&_time_format=sqlite%s", sq.File, sq.Timeout.Milliseconds(), journalMode)

	db, err := sql.Open("sqlite", connStr)
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
		if sq.DebugEnabled {
			return &debugExecutor{sq.DB}
		}

		return sq.DB
	}

	if sq.DebugEnabled {
		return &debugExecutor{tx}
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

func txFromCtx(ctx context.Context) (database.Executor, bool) {
	tx, ok := ctx.Value(ctxTxKey).(database.Executor)
	return tx, ok
}

func ctxWithTx(parent context.Context, tx database.Executor) context.Context {
	return context.WithValue(parent, ctxTxKey, tx)
}

type debugExecutor struct {
	exec database.Executor
}

func (d *debugExecutor) ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error) {
	slog.DebugContext(ctx, "executing query", slog.String("query", query), slog.Any("args", args))
	return d.exec.ExecContext(ctx, query, args...)
}

func (d *debugExecutor) PrepareContext(ctx context.Context, query string) (*sql.Stmt, error) {
	return d.exec.PrepareContext(ctx, query)
}

func (d *debugExecutor) QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	slog.DebugContext(ctx, "executing query", slog.String("query", query), slog.Any("args", args))
	return d.exec.QueryContext(ctx, query, args...)
}

func (d *debugExecutor) QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row {
	slog.DebugContext(ctx, "executing query", slog.String("query", query), slog.Any("args", args))
	return d.exec.QueryRowContext(ctx, query, args...)
}
