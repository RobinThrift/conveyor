package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
)

type LocalAuthRepo struct {
	db database.Database
}

func NewLocalAuthRepo(db database.Database) *LocalAuthRepo {
	return &LocalAuthRepo{db}
}

func (r *LocalAuthRepo) Get(ctx context.Context, username string) (*auth.LocalAuthAccount, error) {
	account, err := queries.GetLocalAuthAccountByUsername(ctx, r.db.Conn(ctx), username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, auth.ErrLocalAuthAccountNotFound
		}

		return nil, err
	}

	return &auth.LocalAuthAccount{
		ID:                     account.ID,
		Username:               account.Username,
		Algorithm:              account.Algorithm,
		Params:                 account.Params,
		Salt:                   account.Salt,
		Password:               account.Password,
		RequiresPasswordChange: account.RequiresPasswordChange,
		CreatedAt:              account.CreatedAt.Time,
		UpdatedAt:              account.UpdatedAt.Time,
	}, nil
}

func (r *LocalAuthRepo) Create(ctx context.Context, account *auth.LocalAuthAccount) error {
	return queries.CreateLocalAuthAccount(ctx, r.db.Conn(ctx), sqlc.CreateLocalAuthAccountParams{
		Username:               account.Username,
		Algorithm:              account.Algorithm,
		Params:                 account.Params,
		Salt:                   account.Salt,
		Password:               account.Password,
		RequiresPasswordChange: account.RequiresPasswordChange,
	})
}

func (r *LocalAuthRepo) Update(ctx context.Context, account *auth.LocalAuthAccount) error {
	return queries.UpdateALocalAuthccount(ctx, r.db.Conn(ctx), sqlc.UpdateALocalAuthccountParams{
		ID:                     account.ID,
		Algorithm:              account.Algorithm,
		Params:                 account.Params,
		Salt:                   account.Salt,
		Password:               account.Password,
		RequiresPasswordChange: account.RequiresPasswordChange,
		UpdatedAt:              types.NewSQLiteDatetime(time.Now().UTC()),
	})
}
