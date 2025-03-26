package control

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
)

type APITokenController struct {
	config        AuthConfig
	transactioner database.Transactioner
	repo          APITokenControllerRepo
	tokenRepo     APITokenControllerAuthTokenRepo
}

type APITokenControllerRepo interface {
	GetAPITokenByName(ctx context.Context, accountID domain.AccountID, name string) (*domain.APIToken, error)
	ListAPITokens(ctx context.Context, accountID domain.AccountID, query domain.ListAPITokenQuery) (*domain.APITokenList, error)
	CreateAPIToken(ctx context.Context, token *domain.APIToken) error
	DeleteAPITokenByName(ctx context.Context, accountID domain.AccountID, name string) error
}

type APITokenControllerAuthTokenRepo interface {
	GetAuthTokenByID(ctx context.Context, accountID domain.AccountID, id auth.AuthTokenID) (*auth.AuthToken, error)
	CreateAuthToken(ctx context.Context, token *auth.AuthToken) (auth.AuthTokenID, error)
	InvalidateAuthToken(ctx context.Context, value auth.AuthTokenValue) error
}

func NewAPITokenController(config AuthConfig, transactioner database.Transactioner, repo APITokenControllerRepo, tokenRepo APITokenControllerAuthTokenRepo) *APITokenController {
	return &APITokenController{config, transactioner, repo, tokenRepo}
}

func (atc *APITokenController) GetAPITokenByName(ctx context.Context, name string) (*domain.APIToken, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return atc.repo.GetAPITokenByName(ctx, account.ID, name)
}

type ListAPITokenQuery = domain.ListAPITokenQuery

func (atc *APITokenController) ListAPITokens(ctx context.Context, query ListAPITokenQuery) (*domain.APITokenList, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return atc.repo.ListAPITokens(ctx, account.ID, query)
}

type CreateAPITokenCmd struct {
	Name      string
	ExpiresAt time.Time
}

func (atc *APITokenController) CreateAPIToken(ctx context.Context, cmd CreateAPITokenCmd) (string, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return "", auth.ErrUnauthorized
	}

	plaintextToken, err := auth.NewPlaintextAuthToken(atc.config.AuthTokenLength, cmd.ExpiresAt, cmd.ExpiresAt)
	if err != nil {
		return "", fmt.Errorf("error creating api token value: %w", err)
	}

	return database.InTransaction(ctx, atc.transactioner, func(ctx context.Context) (string, error) {
		id, err := atc.tokenRepo.CreateAuthToken(ctx, &auth.AuthToken{
			AccountID:        account.ID,
			Value:            plaintextToken.Plaintext.Encrypt(atc.config.Argon2Params),
			ExpiresAt:        plaintextToken.ExpiresAt,
			RefreshValue:     plaintextToken.RefreshPlaintext.Encrypt(atc.config.Argon2Params),
			RefreshExpiresAt: plaintextToken.RefreshExpiresAt,
		})
		if err != nil {
			return "", err
		}

		apitoken := &domain.APIToken{
			AccountID: account.ID,
			TokenID:   int64(id),
			Name:      cmd.Name,
			ExpiresAt: cmd.ExpiresAt,
		}

		err = atc.repo.CreateAPIToken(ctx, apitoken)
		if err != nil {
			return "", err
		}

		return plaintextToken.Plaintext.Export(), nil
	})
}

func (atc *APITokenController) DeleteAPITokenByName(ctx context.Context, name string) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return atc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		apitoken, err := atc.repo.GetAPITokenByName(ctx, account.ID, name)
		if err != nil {
			if errors.Is(err, domain.ErrAPITokenNotFound) {
				return nil
			}

			return err
		}

		token, err := atc.tokenRepo.GetAuthTokenByID(ctx, apitoken.AccountID, auth.AuthTokenID(apitoken.TokenID))
		if err != nil {
			if errors.Is(err, auth.ErrAuthTokenNotFound) {
				return nil
			}

			return err
		}

		err = atc.tokenRepo.InvalidateAuthToken(ctx, token.Value)
		if err != nil {
			return err
		}

		return atc.repo.DeleteAPITokenByName(ctx, account.ID, name)
	})
}
