package apiv1

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/RobinThrift/belt/internal/auth"
)

var errBadRequest = errors.New("invalid request")
var errNotFound = errors.New("not found")

func errorHandlerFunc(w http.ResponseWriter, r *http.Request, err error) {
	slog.ErrorContext(r.Context(), err.Error(), slog.Any("error", err), slog.String("path", r.URL.Path), slog.String("method", r.Method))

	apiErr := Error{
		Code:   http.StatusInternalServerError,
		Detail: err.Error(),
		Title:  http.StatusText(http.StatusInternalServerError),
		Type:   "belt/api/v1/InternalServerError",
	}

	switch {
	case errors.Is(err, auth.ErrUnauthorized):
		apiErr = Error{
			Code:   http.StatusUnauthorized,
			Title:  http.StatusText(http.StatusUnauthorized),
			Detail: err.Error(),
			Type:   "belt/api/v1/Unauthorized",
		}
	case errors.Is(err, errNotFound):
		apiErr = Error{
			Code:   http.StatusNotFound,
			Title:  http.StatusText(http.StatusNotFound),
			Detail: err.Error(),
			Type:   "belt/api/v1/NotFound",
		}
	case errors.Is(err, errBadRequest):
		apiErr = Error{
			Code:   http.StatusBadRequest,
			Title:  "BadRequest",
			Detail: err.Error(),
			Type:   "belt/api/v1/BadRequest",
		}
	}

	if asAPIErr, ok := err.(*Error); ok {
		apiErr = *asAPIErr
	}

	w.WriteHeader(apiErr.Code)

	b, err := json.Marshal(apiErr)
	if err != nil {
		slog.ErrorContext(r.Context(), "error while trying to marshal api error to json", slog.Any("error", err))
		return
	}

	_, err = w.Write(b)
	if err != nil {
		slog.ErrorContext(r.Context(), "error while writing http response", slog.Any("error", err))
		return
	}
}

// func notFoundHandlerFunc(w http.ResponseWriter, r *http.Request) {
// 	slog.ErrorContext(r.Context(), "not found")
//
// 	apiErr := Error{
// 		Code:   http.StatusNotFound,
// 		Title:  http.StatusText(http.StatusNotFound),
// 		Detail: r.URL.String(),
// 		Type:   "belt/api/v1/NotFound",
// 	}
//
// 	w.WriteHeader(apiErr.Code)
//
// 	b, err := json.Marshal(apiErr)
// 	if err != nil {
// 		slog.ErrorContext(r.Context(), "error while trying to marshal api error to json", slog.Any("error", err))
// 		return
// 	}
//
// 	_, err = w.Write(b)
// 	if err != nil {
// 		slog.ErrorContext(r.Context(), "error while writing http response", slog.Any("error", err))
// 		return
// 	}
// }

// func methodNotAllowedHandlerFunc(w http.ResponseWriter, r *http.Request) {
// 	slog.ErrorContext(r.Context(), "method not allowed")
//
// 	apiErr := Error{
// 		Code:   http.StatusMethodNotAllowed,
// 		Title:  http.StatusText(http.StatusMethodNotAllowed),
// 		Detail: r.URL.String(),
// 		Type:   "belt/api/v1/MethodNotAllowed",
// 	}
//
// 	w.WriteHeader(apiErr.Code)
//
// 	b, err := json.Marshal(apiErr)
// 	if err != nil {
// 		slog.ErrorContext(r.Context(), "error while trying to marshal api error to json", slog.Any("error", err))
// 		return
// 	}
//
// 	_, err = w.Write(b)
// 	if err != nil {
// 		slog.ErrorContext(r.Context(), "error while writing http response", slog.Any("error", err))
// 		return
// 	}
// }

func recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func(ctx context.Context) {
			if p := recover(); p != nil {
				if p == http.ErrAbortHandler {
					// we don't recover http.ErrAbortHandler so the response
					// to the client is aborted, this should not be logged
					panic(p)
				}

				slog.ErrorContext(ctx, "panic recovered", slog.Any("error", p), slog.String("stack", string(debug.Stack())))

				apiErr := Error{
					Code:   http.StatusInternalServerError,
					Detail: fmt.Sprint(p),
					Title:  http.StatusText(http.StatusInternalServerError),
					Type:   "belt/api/v1/InternalServerError",
				}

				w.WriteHeader(apiErr.Code)

				b, err := json.Marshal(apiErr)
				if err != nil {
					slog.ErrorContext(ctx, "error while trying to marshal api error to json", slog.Any("error", err))
					return
				}

				_, err = w.Write(b)
				if err != nil {
					slog.ErrorContext(ctx, "error while writing http response", slog.Any("error", err))
					return
				}
			}
		}(r.Context())

		next.ServeHTTP(w, r)
	})
}

func (e *Error) Error() string {
	return fmt.Sprintf("%s (%d): %s %s", e.Type, e.Code, e.Title, e.Detail)
}
