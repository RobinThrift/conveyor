package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/storage/database"
	"go.robinthrift.com/conveyor/internal/storage/database/sqlite/sqlc"
	"go.robinthrift.com/conveyor/internal/storage/database/sqlite/types"
	"modernc.org/sqlite"
)

type APITokenRepo struct {
	db database.Database
}

func NewAPITokenRepo(db database.Database) *APITokenRepo {
	return &APITokenRepo{db}
}

func (r *APITokenRepo) GetAPITokenByName(ctx context.Context, accountID domain.AccountID, name string) (*domain.APIToken, error) {
	row, err := queries.GetAPIToken(ctx, r.db.Conn(ctx), sqlc.GetAPITokenParams{
		Name:      name,
		AccountID: accountID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = domain.ErrAPITokenNotFound
		}

		return nil, err
	}

	return &domain.APIToken{
		ID:        row.ID,
		TokenID:   row.TokenID,
		AccountID: row.AccountID,
		Name:      row.Name,
		CreatedAt: row.CreatedAt.Time,
		ExpiresAt: row.ExpiresAt.Time,
	}, nil
}

const maxPageSize = 50

func (r *APITokenRepo) ListAPITokens(ctx context.Context, accountID domain.AccountID, query domain.ListAPITokenQuery) (*domain.APITokenList, error) {
	pageAfter := domain.APITokenID(0)
	if query.PageAfter != nil {
		pageAfter = *query.PageAfter
	}

	var pageSize int64
	if query.PageSize >= maxPageSize {
		pageSize = maxPageSize
	} else {
		pageSize = int64(query.PageSize)
	}

	rows, err := queries.ListAPITokens(ctx, r.db.Conn(ctx), sqlc.ListAPITokensParams{
		AccountID: accountID,
		PageAfter: pageAfter,
		PageSize:  pageSize,
	})
	if err != nil {
		return nil, err
	}

	list := &domain.APITokenList{
		Items: make([]*domain.APIToken, len(rows)),
		Next:  nil,
	}

	for i, row := range rows {
		list.Items[i] = &domain.APIToken{
			ID:        row.ID,
			TokenID:   row.TokenID,
			AccountID: row.AccountID,
			Name:      row.Name,
			CreatedAt: row.CreatedAt.Time,
			ExpiresAt: row.ExpiresAt.Time,
		}
	}

	if len(rows) != 0 {
		next := rows[len(rows)-1].ID
		list.Next = &next
	}

	return list, nil
}

func (r *APITokenRepo) CreateAPIToken(ctx context.Context, token *domain.APIToken) error {
	err := queries.CreateAPIToken(ctx, r.db.Conn(ctx), sqlc.CreateAPITokenParams{
		TokenID:   token.TokenID,
		AccountID: token.AccountID,
		Name:      token.Name,
		ExpiresAt: types.NewSQLiteDatetime(token.ExpiresAt),
	})

	if err != nil {
		var sqlErr *sqlite.Error
		if errors.As(err, &sqlErr) && sqlErr.Code() == 787 {
			return domain.ErrInvalidAccountReference
		}

		return err
	}

	return nil
}

func (r *APITokenRepo) DeleteAPITokenByName(ctx context.Context, accountID domain.AccountID, name string) error {
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
