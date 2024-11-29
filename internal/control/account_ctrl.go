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
	Create(ctx context.Context, account *auth.Account) error
	Update(ctx context.Context, account *auth.Account) error
	Get(ctx context.Context, id int64) (*auth.Account, error)
	GetByUsername(ctx context.Context, username string) (*auth.Account, error)
	GetByRef(ctx context.Context, ref string) (*auth.Account, error)
}

func NewAccountController(transactioner database.Transactioner, repo AccountControlAccountRepo) *AccountControl {
	return &AccountControl{transactioner: transactioner, repo: repo}
}

func (ac *AccountControl) Get(ctx context.Context, id int64) (*auth.Account, error) {
	account, err := ac.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	return account, nil
}

func (ac *AccountControl) GetByUsername(ctx context.Context, username string) (*auth.Account, error) {
	user, err := ac.repo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (ac *AccountControl) GetByRef(ctx context.Context, ref string) (*auth.Account, error) {
	user, err := ac.repo.GetByRef(ctx, ref)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (ac *AccountControl) Create(ctx context.Context, account *auth.Account) error {
	return ac.repo.Create(ctx, account)
}

type UpdateAccountInfoCmd struct {
	DisplayName *string
}

func (ac *AccountControl) UpdateAccountInfo(ctx context.Context, cmd UpdateAccountInfoCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	if cmd.DisplayName != nil {
		account.DisplayName = *cmd.DisplayName
		err := ac.repo.Update(ctx, account)
		if err != nil {
			return err
		}
	}

	return nil
}

func (ac *AccountControl) CountAccounts(ctx context.Context) (int64, error) {
	return ac.repo.CountAccounts(ctx)
}
