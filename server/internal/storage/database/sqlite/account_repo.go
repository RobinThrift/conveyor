package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/sqlc"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/types"
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

func (r *AccountRepo) Get(ctx context.Context, id domain.AccountID) (*domain.Account, error) {
	account, err := queries.GetAccount(ctx, r.db.Conn(ctx), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("%w: id %d", domain.ErrAccountNotFound, id)
		}

		return nil, fmt.Errorf("error getting account by id: id %d: %w", id, err)
	}

	return &domain.Account{
		ID:       account.ID,
		Username: account.Username,
		Password: domain.AccountPassword{
			Algorithm:      account.Algorithm,
			Params:         account.Params,
			Salt:           account.Salt,
			Password:       account.Password,
			RequiresChange: account.RequiresPasswordChange,
		},
		CreatedAt: account.CreatedAt.Time,
		UpdatedAt: account.UpdatedAt.Time,
	}, nil
}

func (r *AccountRepo) GetByUsername(ctx context.Context, username string) (*domain.Account, error) {
	account, err := queries.GetAccountByUsername(ctx, r.db.Conn(ctx), username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("%w: %s", domain.ErrAccountNotFound, username)
		}

		return nil, fmt.Errorf("error getting account by username: %s: %w", username, err)
	}

	return &domain.Account{
		ID:       account.ID,
		Username: account.Username,
		Password: domain.AccountPassword{
			Algorithm:      account.Algorithm,
			Params:         account.Params,
			Salt:           account.Salt,
			Password:       account.Password,
			RequiresChange: account.RequiresPasswordChange,
		},
		CreatedAt: account.CreatedAt.Time,
		UpdatedAt: account.UpdatedAt.Time,
	}, nil
}

func (r *AccountRepo) Create(ctx context.Context, toCreate *domain.Account) error {
	return queries.CreateAccount(ctx, r.db.Conn(ctx), sqlc.CreateAccountParams{
		Username:  toCreate.Username,
		Algorithm: toCreate.Password.Algorithm,
		Params:    toCreate.Password.Params,
		Salt:      toCreate.Password.Salt,
		Password:  toCreate.Password.Password,
	})
}

func (r *AccountRepo) Update(ctx context.Context, toUpdate *domain.Account) error {
	return queries.UpdateAccount(ctx, r.db.Conn(ctx), sqlc.UpdateAccountParams{
		ID:                     toUpdate.ID,
		Algorithm:              toUpdate.Password.Algorithm,
		Params:                 toUpdate.Password.Params,
		Salt:                   toUpdate.Password.Salt,
		Password:               toUpdate.Password.Password,
		RequiresPasswordChange: toUpdate.Password.RequiresChange,
		UpdatedAt:              types.NewSQLiteDatetime(time.Now().UTC()),
	})
}
