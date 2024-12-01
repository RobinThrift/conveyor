package control

import (
	"context"
	"fmt"

	"github.com/RobinThrift/belt/internal/auth"
)

type APITokenController struct {
	config AuthConfig
	repo   APITokenControllerRepo
}

type APITokenControllerRepo interface {
	GetAPIToken(ctx context.Context, value auth.APITokenValue) (*auth.APIToken, error)
	ListAPITokens(ctx context.Context, accountID auth.AccountID, query auth.ListAPITokenQuery) (*auth.APITokenList, error)
	CreateAPIToken(ctx context.Context, token *auth.APIToken) error
	DeleteAPIToken(ctx context.Context, accountID auth.AccountID, name string) error
}

func NewAPITokenController(config AuthConfig, repo APITokenControllerRepo) *APITokenController {
	return &APITokenController{config, repo}
}

func (atc *APITokenController) GetAPIToken(ctx context.Context, plaintextToken auth.APITokenValue) (*auth.APIToken, error) {
	apiToken, err := auth.NewAPITokenValuePairFromEncoded(plaintextToken)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCredentials, err)
	}

	value := apiToken.Encrypt(atc.config.Argon2Params)

	return atc.repo.GetAPIToken(ctx, value)
}

type ListAPITokenQuery = auth.ListAPITokenQuery

func (atc *APITokenController) ListAPITokens(ctx context.Context, query ListAPITokenQuery) (*auth.APITokenList, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return atc.repo.ListAPITokens(ctx, account.ID, query)
}

func (atc *APITokenController) CreateAPIToken(ctx context.Context, token *auth.APIToken) (string, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return "", auth.ErrUnauthorized
	}

	valuePair, err := auth.NewAPITokenValuePair(atc.config.APITokenLength)
	if err != nil {
		return "", err
	}

	token.Value = valuePair.Encrypt(atc.config.Argon2Params)
	token.AccountID = account.ID

	err = atc.repo.CreateAPIToken(ctx, token)
	if err != nil {
		return "", err
	}

	return valuePair.String(), nil
}

func (atc *APITokenController) DeleteAPIToken(ctx context.Context, name string) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return atc.repo.DeleteAPIToken(ctx, account.ID, name)
}
