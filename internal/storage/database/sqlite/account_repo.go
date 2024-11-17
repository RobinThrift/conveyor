package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
)

type AccountRepo struct {
	db database.Database
}

func NewAccountRepo(db database.Database) *AccountRepo {
	return &AccountRepo{db}
}

func (r *AccountRepo) CountAccounts(ctx context.Context) (int64, error) {
	count, err := queries.CountAccounts(ctx, r.db.Conn(ctx))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}

		return 0, fmt.Errorf("error counting accounts: %w", err)
	}

	return count, nil
}

func (r *AccountRepo) Get(ctx context.Context, id int64) (*auth.Account, error) {
	account, err := queries.GetAccount(ctx, r.db.Conn(ctx), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("%w: id %d", auth.ErrAccountNotFound, id)
		}

		return nil, fmt.Errorf("error getting account by id: id %d: %w", id, err)
	}

	return &auth.Account{
		ID:          auth.AccountID(account.ID),
		Username:    account.Username,
		DisplayName: account.DisplayName,
		IsAdmin:     account.IsAdmin,
		AuthRef:     account.AuthRef,
		CreatedAt:   account.CreatedAt.Time,
		UpdatedAt:   account.UpdatedAt.Time,
	}, nil
}

func (r *AccountRepo) GetByUsername(ctx context.Context, username string) (*auth.Account, error) {
	account, err := queries.GetAccountByUsername(ctx, r.db.Conn(ctx), username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("%w: %s", auth.ErrAccountNotFound, username)
		}

		return nil, fmt.Errorf("error getting account by username: %s: %w", username, err)
	}

	return &auth.Account{
		ID:          auth.AccountID(account.ID),
		Username:    account.Username,
		DisplayName: account.DisplayName,
		IsAdmin:     account.IsAdmin,
		AuthRef:     account.AuthRef,
		CreatedAt:   account.CreatedAt.Time,
		UpdatedAt:   account.UpdatedAt.Time,
	}, nil
}

func (r *AccountRepo) GetByRef(ctx context.Context, ref string) (*auth.Account, error) {
	account, err := queries.GetAccountByRef(ctx, r.db.Conn(ctx), ref)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("%w: ref(%s)", auth.ErrAccountNotFound, ref)
		}

		return nil, fmt.Errorf("error getting account by ref: %s: %w", ref, err)
	}

	return &auth.Account{
		ID:          auth.AccountID(account.ID),
		Username:    account.Username,
		DisplayName: account.DisplayName,
		IsAdmin:     account.IsAdmin,
		AuthRef:     account.AuthRef,
		CreatedAt:   account.CreatedAt.Time,
		UpdatedAt:   account.UpdatedAt.Time,
	}, nil
}

func (r *AccountRepo) Create(ctx context.Context, toCreate *auth.Account) error {
	return queries.CreateAccount(ctx, r.db.Conn(ctx), sqlc.CreateAccountParams{
		Username:    toCreate.Username,
		DisplayName: toCreate.DisplayName,
		IsAdmin:     toCreate.IsAdmin,
		AuthRef:     toCreate.AuthRef,
	})
}

func (r *AccountRepo) Update(ctx context.Context, toUpdate *auth.Account) error {
	return queries.UpdateAccount(ctx, r.db.Conn(ctx), sqlc.UpdateAccountParams{
		ID:          int64(toUpdate.ID),
		DisplayName: toUpdate.DisplayName,
		UpdatedAt:   types.NewSQLiteDatetime(time.Now().UTC()),
	})
}
