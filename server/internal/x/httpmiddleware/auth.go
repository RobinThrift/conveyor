package httpmiddleware

import (
	"context"
	"errors"
	"net/http"
	"slices"
	"strings"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/x/httperrors"
)

func NewAuthMiddleware(accountFetcher interface {
	GetAccountForAuthToken(ctx context.Context, value auth.PlaintextAuthTokenValue) (*domain.Account, error)
},
	errorHandler httperrors.ErrorHandlerFunc,
	ignoreRoutes []string,
) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if slices.Contains(ignoreRoutes, r.URL.Path) {
				next.ServeHTTP(w, r)

				return
			}

			token, ok := authTokenFromHeader(r.Header)
			if !ok {
				errorHandler(w, r, auth.ErrUnauthorized)

				return
			}

			account, err := accountFetcher.GetAccountForAuthToken(r.Context(), *token)
			if account == nil || errors.Is(err, auth.ErrUnauthorized) {
				errorHandler(w, r, auth.ErrUnauthorized)

				return
			}

			if err != nil {
				errorHandler(w, r, &httperrors.Error{
					Code:  http.StatusInternalServerError,
					Title: http.StatusText(http.StatusInternalServerError),
					Type:  "belt/api/sync/v1/InternalServerError",
				})

				return
			}

			ctx := auth.CtxWithAccount(r.Context(), account)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

const authHeader = "Authorization"

func authTokenFromHeader(header http.Header) (*auth.PlaintextAuthTokenValue, bool) {
	token := header.Get(authHeader)
	if token == "" || token == "Bearer" {
		return nil, false
	}

	value, err := auth.NewPlaintextAuthTokenValueFromString(strings.TrimPrefix(token, "Bearer "))
	if err != nil {
		return nil, false
	}

	return value, true
}
