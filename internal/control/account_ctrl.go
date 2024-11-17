package control

import (
	"context"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database"
)

type AccountControl struct {
	transactioner database.Transactioner
	repo          AccountControlAccountRepo
}

type AccountControlAccountRepo interface {
	CountAccounts(ctx context.Context) (int64, error)
	Create(ctx context.Context, user *auth.Account) error
	Update(ctx context.Context, user *auth.Account) error
	Get(ctx context.Context, id int64) (*auth.Account, error)
	GetByUsername(ctx context.Context, username string) (*auth.Account, error)
	GetByRef(ctx context.Context, ref string) (*auth.Account, error)
}

func NewAccountController(transactioner database.Transactioner, repo AccountControlAccountRepo) *AccountControl {
	return &AccountControl{transactioner: transactioner, repo: repo}
}

func (cc *AccountControl) Get(ctx context.Context, id int64) (*auth.Account, error) {
	return database.InTransaction(ctx, cc.transactioner, func(ctx context.Context) (*auth.Account, error) {
		user, err := cc.repo.Get(ctx, id)
		if err != nil {
			return nil, err
		}

		return user, nil
	})
}

func (cc *AccountControl) GetByUsername(ctx context.Context, username string) (*auth.Account, error) {
	return database.InTransaction(ctx, cc.transactioner, func(ctx context.Context) (*auth.Account, error) {
		user, err := cc.repo.GetByUsername(ctx, username)
		if err != nil {
			return nil, err
		}

		return user, nil
	})
}

func (cc *AccountControl) GetByRef(ctx context.Context, ref string) (*auth.Account, error) {
	return database.InTransaction(ctx, cc.transactioner, func(ctx context.Context) (*auth.Account, error) {
		user, err := cc.repo.GetByRef(ctx, ref)
		if err != nil {
			return nil, err
		}

		return user, nil
	})
}

func (cc *AccountControl) Create(ctx context.Context, account *auth.Account) error {
	return cc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		return cc.repo.Create(ctx, account)
	})
}

func (cc *AccountControl) Update(ctx context.Context, account *auth.Account) error {
	return cc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		return cc.repo.Update(ctx, account)
	})
}

func (cc *AccountControl) CountAccounts(ctx context.Context) (int64, error) {
	return database.InTransaction(ctx, cc.transactioner, func(ctx context.Context) (int64, error) {
		return cc.repo.CountAccounts(ctx)
	})
}
