package database

import (
	"context"
	"database/sql"
)

type Database interface {
	Transactioner
	Executor
	Conn(ctx context.Context) Executor
	Close() error
}

type Executor interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	PrepareContext(ctx context.Context, query string) (*sql.Stmt, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

type Transactioner interface {
	InTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

func InTransaction[R any](ctx context.Context, db Transactioner, fn func(ctx context.Context) (R, error)) (R, error) {
	var result R

	err := db.InTransaction(ctx, func(ctx context.Context) error {
		r, err := fn(ctx)
		if err != nil {
			return err
		}

		result = r

		return nil
	})

	if err != nil {
		return result, err
	}

	return result, nil
}
