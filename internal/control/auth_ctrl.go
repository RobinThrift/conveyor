package control

import (
	"context"
	"errors"
	"log/slog"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrPasswordEmpty = errors.New("password must not be empty")

type AuthController struct {
	config        AuthConfig
	transactioner database.Transactioner
	accountCtrl   *AccountControl
	localAuthRepo AuthControllerLocalAuthRepo
}

type AuthControllerLocalAuthRepo interface {
	Get(ctx context.Context, username string) (*auth.LocalAuthAccount, error)
	Create(context.Context, *auth.LocalAuthAccount) error
	Update(context.Context, *auth.LocalAuthAccount) error
}

type AuthConfig struct {
	Argon2Params auth.Argon2Params
}

func NewAuthController(config AuthConfig, transactioner database.Transactioner, accountCtrl *AccountControl, localAuthRepo AuthControllerLocalAuthRepo) *AuthController {
	return &AuthController{config: config, transactioner: transactioner, accountCtrl: accountCtrl, localAuthRepo: localAuthRepo}
}

type GetAccountForCredentialsQuery struct {
	Username        string
	PlaintextPasswd auth.PlaintextPassword
}

func (ac *AuthController) GetAccountForCredentials(ctx context.Context, query GetAccountForCredentialsQuery) (*auth.Account, error) {
	localAccount, err := ac.localAuthRepo.Get(ctx, query.Username)
	if err != nil {
		if errors.Is(err, auth.ErrLocalAuthAccountNotFound) {
			return nil, ErrInvalidCredentials
		}

		return nil, err
	}

	passwordMatch, err := auth.CheckPassword([]byte(query.PlaintextPasswd), localAccount.Password, localAccount.Salt, []byte(localAccount.Params))
	if err != nil {
		slog.ErrorContext(ctx, "error comparing account password", slog.Any("error", err), slog.String("username", query.Username))
		return nil, ErrInvalidCredentials
	}

	if !passwordMatch {
		return nil, ErrInvalidCredentials
	}

	account, err := ac.accountCtrl.GetByRef(ctx, localAccount.Username)
	if err != nil {
		if errors.Is(err, auth.ErrAccountNotFound) {
			slog.ErrorContext(ctx, "fetching account by auth referenced failed even after passwords match", slog.Any("error", err), slog.String("username", query.Username))
			return nil, ErrInvalidCredentials
		}

		return nil, err
	}

	account.RequiresPasswordChange = localAccount.RequiresPasswordChange

	return account, nil
}

type CreateAccountCmd struct {
	Account         *auth.Account
	PlaintextPasswd auth.PlaintextPassword
}

func (ac *AuthController) CreateAccount(ctx context.Context, cmd CreateAccountCmd) error {
	return ac.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		if cmd.PlaintextPasswd == "" {
			return errors.New("initial password cannot be empty")
		}

		params, err := ac.config.Argon2Params.ToJSONString()
		if err != nil {
			return err
		}

		hash, salt, err := auth.EncryptPassword(cmd.PlaintextPasswd, ac.config.Argon2Params)
		if err != nil {
			return err
		}

		err = ac.localAuthRepo.Create(ctx, &auth.LocalAuthAccount{
			Username:               cmd.Account.Username,
			Algorithm:              "argon2",
			Params:                 params,
			Salt:                   salt,
			Password:               hash,
			RequiresPasswordChange: true,
		})
		if err != nil {
			return err
		}

		return ac.accountCtrl.Create(ctx, &auth.Account{
			Username:    cmd.Account.Username,
			DisplayName: cmd.Account.DisplayName,
			IsAdmin:     cmd.Account.IsAdmin,
			AuthRef:     cmd.Account.Username,
		})
	})
}

type ChangeAccountPasswordCmd struct {
	Account             *auth.Account
	CurrPasswdPlaintext auth.PlaintextPassword
	NewPasswdPlaintext  auth.PlaintextPassword
}

func (ac *AuthController) ChangeAccountPassword(ctx context.Context, cmd ChangeAccountPasswordCmd) error {
	localAccount, err := ac.localAuthRepo.Get(ctx, cmd.Account.Username)
	if err != nil {
		slog.ErrorContext(ctx, "error finding account for changing password", slog.Any("error", err), slog.String("username", cmd.Account.Username))
		if errors.Is(err, auth.ErrLocalAuthAccountNotFound) {
			return ErrInvalidCredentials
		}

		return err
	}

	passwordMatch, err := auth.CheckPassword([]byte(cmd.CurrPasswdPlaintext), localAccount.Password, localAccount.Salt, []byte(localAccount.Params))
	if err != nil {
		slog.ErrorContext(ctx, "error comparing account password", slog.Any("error", err), slog.String("username", cmd.Account.Username))
		return ErrInvalidCredentials
	}

	if !passwordMatch {
		return ErrInvalidCredentials
	}

	params, err := ac.config.Argon2Params.ToJSONString()
	if err != nil {
		return err
	}

	hash, salt, err := auth.EncryptPassword(cmd.NewPasswdPlaintext, ac.config.Argon2Params)
	if err != nil {
		return err
	}

	localAccount.Params = params
	localAccount.Password = hash
	localAccount.Salt = salt
	localAccount.RequiresPasswordChange = false

	err = ac.localAuthRepo.Update(ctx, localAccount)
	if err != nil {
		slog.ErrorContext(ctx, "error updating local account in DB", slog.Any("error", err), slog.String("username", cmd.Account.Username))
		return err
	}

	return nil
}

type ResetPasswordCmd struct {
	AccountID       int64
	PlaintextPasswd auth.PlaintextPassword
}

func (ac *AuthController) ResetPassword(ctx context.Context, cmd ResetPasswordCmd) error {
	if cmd.PlaintextPasswd == "" {
		return ErrPasswordEmpty
	}

	return ac.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		account, err := ac.accountCtrl.Get(ctx, cmd.AccountID)
		if err != nil {
			return err
		}

		localAccount, err := ac.localAuthRepo.Get(ctx, account.AuthRef)
		if err != nil {
			slog.ErrorContext(ctx, "error finding account for password reset", slog.Any("error", err), slog.String("username", account.Username))
			return err
		}

		params, err := ac.config.Argon2Params.ToJSONString()
		if err != nil {
			return err
		}

		hash, salt, err := auth.EncryptPassword(cmd.PlaintextPasswd, ac.config.Argon2Params)
		if err != nil {
			return err
		}

		localAccount.Params = params
		localAccount.Password = hash
		localAccount.Salt = salt
		localAccount.RequiresPasswordChange = true

		err = ac.localAuthRepo.Update(ctx, localAccount)
		if err != nil {
			slog.ErrorContext(ctx, "error updating local auth account", slog.Any("error", err), slog.String("username", account.Username))
			return err
		}

		account.RequiresPasswordChange = true
		return nil
	})
}
