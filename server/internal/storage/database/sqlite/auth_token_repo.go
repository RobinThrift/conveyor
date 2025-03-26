package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/sqlc"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/types"
	"modernc.org/sqlite"
)

type AuthTokenRepo struct {
	db database.Database
}

func NewAuthTokenRepo(db database.Database) *AuthTokenRepo {
	return &AuthTokenRepo{db}
}

func (r *AuthTokenRepo) GetAuthTokenByID(ctx context.Context, accountID domain.AccountID, id auth.AuthTokenID) (*auth.AuthToken, error) {
	row, err := queries.GetAuthTokenByID(ctx, r.db.Conn(ctx), sqlc.GetAuthTokenByIDParams{
		ID:        id,
		AccountID: accountID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = auth.ErrAuthTokenNotFound
		}

		return nil, err
	}

	return &auth.AuthToken{
		ID:               row.ID,
		AccountID:        row.AccountID,
		Value:            row.Value,
		ExpiresAt:        row.ExpiresAt.Time,
		RefreshValue:     row.RefreshValue,
		RefreshExpiresAt: row.RefreshExpiresAt.Time,
		CreatedAt:        row.CreatedAt.Time,
	}, nil
}

func (r *AuthTokenRepo) GetAuthToken(ctx context.Context, value auth.AuthTokenValue) (*auth.AuthToken, error) {
	row, err := queries.GetAuthToken(ctx, r.db.Conn(ctx), value)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = auth.ErrAuthTokenNotFound
		}

		return nil, err
	}

	return &auth.AuthToken{
		ID:               row.ID,
		AccountID:        row.AccountID,
		Value:            row.Value,
		ExpiresAt:        row.ExpiresAt.Time,
		RefreshValue:     row.RefreshValue,
		RefreshExpiresAt: row.RefreshExpiresAt.Time,
		CreatedAt:        row.CreatedAt.Time,
	}, nil
}

func (r *AuthTokenRepo) GetAuthTokenByRefreshValue(ctx context.Context, refreshValue auth.AuthTokenValue) (*auth.AuthToken, error) {
	row, err := queries.GetAuthTokenByRefreshValue(ctx, r.db.Conn(ctx), refreshValue)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = auth.ErrAuthTokenNotFound
		}

		return nil, err
	}

	return &auth.AuthToken{
		ID:               row.ID,
		AccountID:        row.AccountID,
		Value:            row.Value,
		ExpiresAt:        row.ExpiresAt.Time,
		RefreshValue:     row.RefreshValue,
		RefreshExpiresAt: row.RefreshExpiresAt.Time,
		CreatedAt:        row.CreatedAt.Time,
	}, nil
}

func (r *AuthTokenRepo) CreateAuthToken(ctx context.Context, token *auth.AuthToken) (auth.AuthTokenID, error) {
	id, err := queries.CreateAuthToken(ctx, r.db.Conn(ctx), sqlc.CreateAuthTokenParams{
		AccountID:        token.AccountID,
		Value:            token.Value,
		ExpiresAt:        types.NewSQLiteDatetime(token.ExpiresAt),
		RefreshValue:     token.RefreshValue,
		RefreshExpiresAt: types.NewSQLiteDatetime(token.RefreshExpiresAt),
	})

	if err != nil {
		var sqlErr *sqlite.Error
		if errors.As(err, &sqlErr) && sqlErr.Code() == 787 {
			return 0, domain.ErrInvalidAccountReference
		}

		return 0, err
	}

	return id, nil
}

func (r *AuthTokenRepo) InvalidateAuthToken(ctx context.Context, value auth.AuthTokenValue) error {
	err := queries.InvalidateAuthToken(ctx, r.db.Conn(ctx), value)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	}

	return nil
}

func (r *AuthTokenRepo) MarkExpiredAuthTokensAsInvalid(ctx context.Context) error {
	err := queries.MarkExpiredAuthTokensAsInvalid(ctx, r.db.Conn(ctx))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	}

	return nil
}

func (r *AuthTokenRepo) DeleteInvalidTokens(ctx context.Context) error {
	err := queries.DeleteInvalidTokens(ctx, r.db.Conn(ctx))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	}

	return nil
}
