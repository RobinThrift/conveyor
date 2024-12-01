package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
	"github.com/mattn/go-sqlite3"
)

type APITokenRepo struct {
	db database.Database
}

func NewAPITokenRepo(db database.Database) *APITokenRepo {
	return &APITokenRepo{db}
}

func (r *APITokenRepo) GetAPIToken(ctx context.Context, value auth.APITokenValue) (*auth.APIToken, error) {
	token, err := queries.GetAPIToken(ctx, r.db.Conn(ctx), value)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = auth.ErrAPITokenNotFound
		}

		return nil, err
	}

	return &auth.APIToken{
		AccountID: token.AccountID,
		Name:      token.Name,
		Value:     token.Value,
		CreatedAt: token.CreatedAt.Time,
		ExpiresAt: token.ExpiresAt.Time,
	}, nil
}

func (r *APITokenRepo) ListAPITokens(ctx context.Context, accountID auth.AccountID, query auth.ListAPITokenQuery) (*auth.APITokenList, error) {
	pageAfter := int64(0)
	if query.PageAfter != nil {
		pageAfter = *query.PageAfter
	}

	rows, err := queries.ListAPITokens(ctx, r.db.Conn(ctx), sqlc.ListAPITokensParams{
		AccountID: accountID,
		PageAfter: pageAfter,
		PageSize:  int64(query.PageSize),
	})
	if err != nil {
		return nil, err
	}

	list := &auth.APITokenList{
		Items: make([]*auth.APIToken, len(rows)),
		Next:  nil,
	}

	for i, token := range rows {
		list.Items[i] = &auth.APIToken{
			AccountID: token.AccountID,
			Name:      token.Name,
			Value:     token.Value,
			CreatedAt: token.CreatedAt.Time,
			ExpiresAt: token.ExpiresAt.Time,
		}
	}

	if len(rows) != 0 {
		next := rows[len(rows)-1].ID
		list.Next = &next
	}

	return list, nil
}

func (r *APITokenRepo) CreateAPIToken(ctx context.Context, token *auth.APIToken) error {
	err := queries.CreateAPIToken(ctx, r.db.Conn(ctx), sqlc.CreateAPITokenParams{
		AccountID: token.AccountID,
		Name:      token.Name,
		Value:     token.Value,
		ExpiresAt: types.NewSQLiteDatetime(token.ExpiresAt),
	})

	if err != nil {
		if errors.Is(err, sqlite3.ErrConstraintForeignKey) {
			return fmt.Errorf("invalid account reference")
		}

		return err
	}

	return nil
}

func (r *APITokenRepo) DeleteAPIToken(ctx context.Context, accountID auth.AccountID, name string) error {
	err := queries.DeleteAPIToken(ctx, r.db.Conn(ctx), sqlc.DeleteAPITokenParams{
		AccountID: accountID,
		Name:      name,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}
		return err
	}

	return nil
}
