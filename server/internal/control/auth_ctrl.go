package control

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrPasswordEmpty = errors.New("password must not be empty")
var ErrRequiresPasswordChange = errors.New("password change required")

type AuthController struct {
	config        AuthConfig
	transactioner database.Transactioner
	accountCtrl   *AccountControl
	authTokenRepo AuthControllerAuthTokenRepo
}

type AuthControllerAuthTokenRepo interface {
	GetAuthToken(ctx context.Context, value auth.AuthTokenValue) (*auth.AuthToken, error)
	GetAuthTokenByRefreshValue(ctx context.Context, refreshValue auth.AuthTokenValue) (*auth.AuthToken, error)
	CreateAuthToken(ctx context.Context, token *auth.AuthToken) error
	InvalidateAuthToken(ctx context.Context, value auth.AuthTokenValue) error
	MarkExpiredAuthTokensAsInvalid(ctx context.Context) error
	DeleteInvalidTokens(ctx context.Context) error
}

type AuthConfig struct {
	Argon2Params              auth.Argon2Params
	AuthTokenLength           uint
	AccessTokenValidDuration  time.Duration
	RefreshTokenValidDuration time.Duration
}

func NewAuthController(config AuthConfig, transactioner database.Transactioner, accountCtrl *AccountControl, authTokenRepo AuthControllerAuthTokenRepo) *AuthController {
	return &AuthController{config, transactioner, accountCtrl, authTokenRepo}
}

func (ac *AuthController) GetAccountForAuthToken(ctx context.Context, plaintextToken auth.PlaintextAuthTokenValue) (*domain.Account, error) {
	token, err := ac.authTokenRepo.GetAuthToken(ctx, auth.AuthTokenValue(plaintextToken.Encrypt(ac.config.Argon2Params)))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCredentials, err)
	}

	account, err := ac.accountCtrl.Get(ctx, token.AccountID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCredentials, err)
	}

	return account, nil
}

type CreateAuthTokenUsingCredentialsCmd struct {
	Username        string
	PlaintextPasswd auth.PlaintextPassword
}

func (ac *AuthController) CreateAuthTokenUsingCredentials(ctx context.Context, cmd CreateAuthTokenUsingCredentialsCmd) (*auth.PlaintextAuthToken, error) {
	account, err := ac.getAccountForCredentials(ctx, GetAccountForCredentialsQuery(cmd))
	if err != nil {
		return nil, fmt.Errorf("error creating auth token: %w", err)
	}

	if account.Password.RequiresChange {
		return nil, ErrRequiresPasswordChange
	}

	now := time.Now()
	plaintextToken, err := auth.NewPlaintextAuthToken(ac.config.AuthTokenLength, now.Add(ac.config.AccessTokenValidDuration), now.Add(ac.config.RefreshTokenValidDuration))
	if err != nil {
		return nil, fmt.Errorf("error creating auth token: %w", err)
	}

	err = ac.authTokenRepo.CreateAuthToken(ctx, &auth.AuthToken{
		AccountID:        account.ID,
		Value:            plaintextToken.Plaintext.Encrypt(ac.config.Argon2Params),
		ExpiresAt:        plaintextToken.ExpiresAt,
		RefreshValue:     plaintextToken.RefreshPlaintext.Encrypt(ac.config.Argon2Params),
		RefreshExpiresAt: plaintextToken.RefreshExpiresAt,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating auth token: %w", err)
	}

	return plaintextToken, nil
}

type CreateAuthTokenUsingRefreshTokenCmd struct {
	PlaintextRefreshToken auth.PlaintextAuthTokenValue
}

func (ac *AuthController) CreateAuthTokenUsingRefreshToken(ctx context.Context, cmd CreateAuthTokenUsingRefreshTokenCmd) (*auth.PlaintextAuthToken, error) {
	token, err := ac.authTokenRepo.GetAuthTokenByRefreshValue(ctx, auth.AuthTokenValue(cmd.PlaintextRefreshToken.Encrypt(ac.config.Argon2Params)))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCredentials, err)
	}

	account, err := ac.accountCtrl.Get(ctx, token.AccountID)
	if err != nil {
		return nil, err
	}

	return database.InTransaction(ctx, ac.transactioner, func(ctx context.Context) (*auth.PlaintextAuthToken, error) {
		err := ac.authTokenRepo.InvalidateAuthToken(ctx, token.Value)
		if err != nil {
			return nil, fmt.Errorf("error invalidating token: %w", err)
		}

		now := time.Now()
		plaintextToken, err := auth.NewPlaintextAuthToken(ac.config.AuthTokenLength, now.Add(ac.config.AccessTokenValidDuration), now.Add(ac.config.RefreshTokenValidDuration))
		if err != nil {
			return nil, fmt.Errorf("error creating auth token: %w", err)
		}

		err = ac.authTokenRepo.CreateAuthToken(ctx, &auth.AuthToken{
			AccountID:        account.ID,
			Value:            plaintextToken.Plaintext.Encrypt(ac.config.Argon2Params),
			ExpiresAt:        plaintextToken.ExpiresAt,
			RefreshValue:     plaintextToken.RefreshPlaintext.Encrypt(ac.config.Argon2Params),
			RefreshExpiresAt: plaintextToken.RefreshExpiresAt,
		})
		if err != nil {
			return nil, fmt.Errorf("error creating auth token: %w", err)
		}

		return plaintextToken, nil
	})
}

type CreateAccountCmd struct {
	Account         *domain.Account
	PlaintextPasswd auth.PlaintextPassword
}

func (ac *AuthController) CreateAccount(ctx context.Context, cmd CreateAccountCmd) error {
	return ac.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		if len(cmd.PlaintextPasswd) == 0 {
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

		return ac.accountCtrl.Create(ctx, &domain.Account{
			Username: cmd.Account.Username,
			Password: domain.AccountPassword{
				Algorithm:      "argon2",
				Params:         params,
				Salt:           salt,
				Password:       hash,
				RequiresChange: true,
			},
		})
	})
}

type GetAccountForCredentialsQuery struct {
	Username        string
	PlaintextPasswd auth.PlaintextPassword
}

func (ac *AuthController) getAccountForCredentials(ctx context.Context, query GetAccountForCredentialsQuery) (*domain.Account, error) {
	account, err := ac.accountCtrl.GetByUsername(ctx, query.Username)
	if err != nil {
		if errors.Is(err, domain.ErrAccountNotFound) {
			return nil, ErrInvalidCredentials
		}

		return nil, err
	}

	passwordMatch, err := auth.CheckPassword(query.PlaintextPasswd, account.Password.Password, account.Password.Salt, []byte(account.Password.Params))
	if err != nil {
		slog.ErrorContext(ctx, "error comparing account password", slog.Any("error", err), slog.String("username", query.Username))
		return nil, ErrInvalidCredentials
	}

	if !passwordMatch {
		return nil, ErrInvalidCredentials
	}

	return account, nil
}

type ChangeAccountPasswordCmd struct {
	Username            string
	CurrPasswdPlaintext auth.PlaintextPassword
	NewPasswdPlaintext  auth.PlaintextPassword
}

func (ac *AuthController) ChangeAccountPassword(ctx context.Context, cmd ChangeAccountPasswordCmd) error {
	account := auth.AccountFromCtx(ctx)
	var err error

	if account == nil {
		account, err = ac.getAccountForCredentials(ctx, GetAccountForCredentialsQuery{
			Username:        cmd.Username,
			PlaintextPasswd: cmd.CurrPasswdPlaintext,
		})
		if err != nil {
			return auth.ErrUnauthorized
		}
	}

	if account == nil {
		return auth.ErrUnauthorized
	}

	passwordMatch, err := auth.CheckPassword(cmd.CurrPasswdPlaintext, account.Password.Password, account.Password.Salt, []byte(account.Password.Params))
	if err != nil {
		slog.ErrorContext(ctx, "error comparing account password", slog.Any("error", err), slog.String("username", account.Username))
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

	account.Password = domain.AccountPassword{
		Algorithm:      account.Password.Algorithm,
		Params:         params,
		Salt:           salt,
		Password:       hash,
		RequiresChange: false,
	}

	err = ac.accountCtrl.Update(ctx, account)
	if err != nil {
		slog.ErrorContext(ctx, "error updating account in DB", slog.Any("error", err), slog.String("username", account.Username))
		return err
	}

	return nil
}

func (ac *AuthController) CleanupInvalidTokens(ctx context.Context) error {
	err := ac.authTokenRepo.MarkExpiredAuthTokensAsInvalid(ctx)
	if err != nil {
		return fmt.Errorf("error cleaning up invalid tokens: error marking exipired tokens as invalid: %w", err)
	}

	err = ac.authTokenRepo.DeleteInvalidTokens(ctx)
	if err != nil {
		return fmt.Errorf("error cleaning up invalid tokens: error deleting invalid tokens: %w", err)
	}

	return nil
}
