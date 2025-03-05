package control

import (
	"context"

	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
)

type AccountControl struct {
	transactioner database.Transactioner
	repo          AccountControlAccountRepo
}

type AccountControlAccountRepo interface {
	CountAccounts(ctx context.Context) (int64, error)
	Create(ctx context.Context, account *domain.Account) error
	Update(ctx context.Context, account *domain.Account) error
	Get(ctx context.Context, id domain.AccountID) (*domain.Account, error)
	GetByUsername(ctx context.Context, username string) (*domain.Account, error)
}

func NewAccountController(transactioner database.Transactioner, repo AccountControlAccountRepo) *AccountControl {
	return &AccountControl{transactioner: transactioner, repo: repo}
}

func (ac *AccountControl) Get(ctx context.Context, id domain.AccountID) (*domain.Account, error) {
	account, err := ac.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	return account, nil
}

func (ac *AccountControl) GetByUsername(ctx context.Context, username string) (*domain.Account, error) {
	user, err := ac.repo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (ac *AccountControl) Create(ctx context.Context, account *domain.Account) error {
	return ac.repo.Create(ctx, account)
}

func (ac *AccountControl) Update(ctx context.Context, account *domain.Account) error {
	return ac.repo.Update(ctx, account)
}

func (ac *AccountControl) CountAccounts(ctx context.Context) (int64, error) {
	return ac.repo.CountAccounts(ctx)
}
