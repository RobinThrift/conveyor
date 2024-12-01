// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: api_tokens.sql

package sqlc

import (
	"context"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
)

const createAPIToken = `-- name: CreateAPIToken :exec
INSERT INTO api_tokens(
    account_id,
    name,
    value,
    expires_at
) VALUES (?, ?, ?, ?)
`

type CreateAPITokenParams struct {
	AccountID auth.AccountID
	Name      string
	Value     []byte
	ExpiresAt types.SQLiteDatetime
}

func (q *Queries) CreateAPIToken(ctx context.Context, db DBTX, arg CreateAPITokenParams) error {
	_, err := db.ExecContext(ctx, createAPIToken,
		arg.AccountID,
		arg.Name,
		arg.Value,
		arg.ExpiresAt,
	)
	return err
}

const deleteAPIToken = `-- name: DeleteAPIToken :exec
DELETE FROM api_tokens
WHERE name = ?
AND account_id = ?
`

type DeleteAPITokenParams struct {
	Name      string
	AccountID auth.AccountID
}

func (q *Queries) DeleteAPIToken(ctx context.Context, db DBTX, arg DeleteAPITokenParams) error {
	_, err := db.ExecContext(ctx, deleteAPIToken, arg.Name, arg.AccountID)
	return err
}

const getAPIToken = `-- name: GetAPIToken :one
SELECT id, account_id, name, value, created_at, expires_at FROM api_tokens WHERE value = ? AND datetime(expires_at) > datetime("now") LIMIT 1
`

func (q *Queries) GetAPIToken(ctx context.Context, db DBTX, value []byte) (ApiToken, error) {
	row := db.QueryRowContext(ctx, getAPIToken, value)
	var i ApiToken
	err := row.Scan(
		&i.ID,
		&i.AccountID,
		&i.Name,
		&i.Value,
		&i.CreatedAt,
		&i.ExpiresAt,
	)
	return i, err
}

const listAPITokens = `-- name: ListAPITokens :many
SELECT id, account_id, name, value, created_at, expires_at
FROM api_tokens
WHERE id > ?1
AND account_id = ?2
ORDER BY id
LIMIT ?3
`

type ListAPITokensParams struct {
	PageAfter int64
	AccountID auth.AccountID
	PageSize  int64
}

func (q *Queries) ListAPITokens(ctx context.Context, db DBTX, arg ListAPITokensParams) ([]ApiToken, error) {
	rows, err := db.QueryContext(ctx, listAPITokens, arg.PageAfter, arg.AccountID, arg.PageSize)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ApiToken
	for rows.Next() {
		var i ApiToken
		if err := rows.Scan(
			&i.ID,
			&i.AccountID,
			&i.Name,
			&i.Value,
			&i.CreatedAt,
			&i.ExpiresAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
