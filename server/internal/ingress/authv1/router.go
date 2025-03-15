package authv1

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/control"
	"go.robinthrift.com/belt/internal/x/httperrors"
)

type router struct {
	baseURL  string
	authCtrl *control.AuthController
}

func New(baseURL string, mux *http.ServeMux, authCtrl *control.AuthController) {
	r := &router{baseURL, authCtrl}

	errorHandler := httperrors.ErrorHandler("belt/api/v1/auth")

	HandlerWithOptions(NewStrictHandlerWithOptions(r, nil, StrictHTTPServerOptions{
		RequestErrorHandlerFunc:  errorHandler,
		ResponseErrorHandlerFunc: errorHandler,
	}), StdHTTPServerOptions{
		BaseRouter:       mux,
		BaseURL:          baseURL + "api/auth/v1",
		ErrorHandlerFunc: errorHandler,
		Middlewares:      []MiddlewareFunc{httperrors.RecoverHandler},
	})
}

// Request a new AuthToken pair.
// (POST /token)
func (router *router) RequestAuthToken(ctx context.Context, req RequestAuthTokenRequestObject) (RequestAuthTokenResponseObject, error) {
	passwordGrantReq, err := req.Body.AsAuthTokenRequestPasswordGrant()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", httperrors.ErrBadRequest, err)
	}

	if passwordGrantReq.GrantType == "password" {
		return router.requestAuthTokenUsingPassword(ctx, passwordGrantReq)
	}

	refreshTokenGrantReq, err := req.Body.AsAuthTokenRequestRefreshTokenGrant()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", httperrors.ErrBadRequest, err)
	}

	if refreshTokenGrantReq.GrantType == "refresh_token" {
		return router.requestAuthTokenUsingRefreshToken(ctx, refreshTokenGrantReq)
	}

	return nil, fmt.Errorf("%w: unsupported grant type: %s", httperrors.ErrBadRequest, refreshTokenGrantReq.GrantType)
}

func (router *router) requestAuthTokenUsingPassword(ctx context.Context, req AuthTokenRequestPasswordGrant) (RequestAuthTokenResponseObject, error) {
	token, err := router.authCtrl.CreateAuthTokenUsingCredentials(ctx, control.CreateAuthTokenUsingCredentialsCmd{
		Username:        req.Username,
		PlaintextPasswd: auth.PlaintextPassword(req.Password),
	})
	if err != nil {
		return nil, err
	}

	return RequestAuthToken201JSONResponse{
		AccessToken:      token.Plaintext.Export(),
		ExpiresAt:        token.ExpiresAt,
		RefreshToken:     token.RefreshPlaintext.Export(),
		RefreshExpiresAt: token.RefreshExpiresAt,
	}, nil
}

func (router *router) requestAuthTokenUsingRefreshToken(ctx context.Context, req AuthTokenRequestRefreshTokenGrant) (RequestAuthTokenResponseObject, error) {
	refreshToken, err := auth.NewPlaintextAuthTokenValueFromString(req.RefreshToken)
	if err != nil {
		return nil, err
	}

	token, err := router.authCtrl.CreateAuthTokenUsingRefreshToken(ctx, control.CreateAuthTokenUsingRefreshTokenCmd{
		PlaintextRefreshToken: *refreshToken,
	})
	if err != nil {
		return nil, err
	}

	return RequestAuthToken201JSONResponse{
		AccessToken:      token.Plaintext.Export(),
		ExpiresAt:        token.ExpiresAt,
		RefreshToken:     token.RefreshPlaintext.Export(),
		RefreshExpiresAt: token.RefreshExpiresAt,
	}, nil
}

// Change acocunt password.
// (POST /change-password)
func (router *router) ChangePassword(ctx context.Context, req ChangePasswordRequestObject) (ChangePasswordResponseObject, error) {
	err := validateChangePasswordData(req.Body)
	if err != nil {
		return nil, err
	}

	err = router.authCtrl.ChangeAccountPassword(ctx, control.ChangeAccountPasswordCmd{
		CurrPasswdPlaintext: auth.PlaintextPassword(req.Body.CurrentPassword),
		NewPasswdPlaintext:  auth.PlaintextPassword(req.Body.NewPassword),
	})
	if err != nil {
		return nil, err
	}

	return ChangePassword200Response{}, nil
}

// Add a new account key.
// (POST /keys)
func (router *router) AddAccountKey(ctx context.Context, req AddAccountKeyRequestObject) (AddAccountKeyResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

// Get a public key by name.
// (GET /keys/{name})
func (router *router) GetAccountKey(ctx context.Context, req GetAccountKeyRequestObject) (GetAccountKeyResponseObject, error) {
	panic("not implemented") // TODO: Implement
}

// Check if the provided access token is valid.
// (GET /check-access)
func (router *router) CheckAccess(ctx context.Context, req CheckAccessRequestObject) (CheckAccessResponseObject, error) {
	bearer := strings.TrimPrefix(req.Params.Authorization, "Bearer ")
	if bearer == "" || bearer == "Bearer" {
		return nil, auth.ErrUnauthorized
	}

	value, err := auth.NewPlaintextAuthTokenValueFromString(strings.TrimPrefix(bearer, "Bearer "))
	if err != nil {
		return nil, auth.ErrUnauthorized
	}

	account, err := router.authCtrl.GetAccountForAuthToken(ctx, *value)
	if account == nil || errors.Is(err, auth.ErrUnauthorized) {
		return nil, auth.ErrUnauthorized
	}

	if err != nil {
		return nil, &httperrors.Error{
			Code:  http.StatusInternalServerError,
			Title: http.StatusText(http.StatusInternalServerError),
			Type:  "belt/api/auth/v1/InternalServerError",
		}
	}

	return CheckAccess204Response{}, nil
}

func validateChangePasswordData(body *ChangePasswordJSONRequestBody) error {
	if body.CurrentPassword == "" {
		return &httperrors.Error{
			Code:  http.StatusBadRequest,
			Title: "EmptyCurrentPassword",
			Type:  "belt/api/auth/v1/BadRequest",
		}
	}

	if body.NewPassword == "" {
		return &httperrors.Error{
			Code:  http.StatusBadRequest,
			Title: "EmptyNewPassword",
			Type:  "belt/api/auth/v1/BadRequest",
		}
	}

	if body.NewPasswordRepeat == "" {
		return &httperrors.Error{
			Code:  http.StatusBadRequest,
			Title: "EmptyRepeateNewPassword",
			Type:  "belt/api/auth/v1/BadRequest",
		}
	}

	if body.NewPassword != body.NewPasswordRepeat {
		return &httperrors.Error{
			Code:  http.StatusBadRequest,
			Title: "NewPasswordsDoNotMatch",
			Type:  "belt/api/auth/v1/BadRequest",
		}
	}

	if body.CurrentPassword == body.NewPassword {
		return &httperrors.Error{
			Code:  http.StatusBadRequest,
			Title: "NewPasswordIsOldPassword",
			Type:  "belt/api/auth/v1/BadRequest",
		}
	}

	return nil
}
