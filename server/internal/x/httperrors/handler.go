package httperrors

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"

	"go.robinthrift.com/conveyor/internal/auth"
)

var ErrBadRequest = errors.New("invalid request")
var ErrNotFound = errors.New("not found")

type ErrorHandlerFunc func(w http.ResponseWriter, r *http.Request, err error)

func ErrorHandler(prefix string) ErrorHandlerFunc {
	return func(w http.ResponseWriter, r *http.Request, err error) {
		slog.ErrorContext(r.Context(), err.Error(), slog.Any("error", err), slog.String("path", r.URL.Path), slog.String("method", r.Method))

		apiErr := Error{
			Code:   http.StatusInternalServerError,
			Detail: err.Error(),
			Title:  http.StatusText(http.StatusInternalServerError),
			Type:   prefix + "/InternalServerError",
		}

		switch {
		case errors.Is(err, auth.ErrUnauthorized):
			apiErr = Error{
				Code:   http.StatusUnauthorized,
				Title:  http.StatusText(http.StatusUnauthorized),
				Detail: err.Error(),
				Type:   prefix + "/Unauthorized",
			}
		case errors.Is(err, ErrNotFound):
			apiErr = Error{
				Code:   http.StatusNotFound,
				Title:  http.StatusText(http.StatusNotFound),
				Detail: err.Error(),
				Type:   prefix + "/NotFound",
			}
		case errors.Is(err, ErrBadRequest):
			apiErr = Error{
				Code:   http.StatusBadRequest,
				Title:  "BadRequest",
				Detail: err.Error(),
				Type:   prefix + "/BadRequest",
			}
		}

		var asAPIErr *Error
		if ok := errors.As(err, &asAPIErr); ok {
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
}

func RecoverHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func(ctx context.Context) {
			if p := recover(); p != nil {
				if err, ok := p.(error); ok && errors.Is(err, http.ErrAbortHandler) { //nolint:noinlineerr // this is actually a cast, the linter just gets confused
					// we don't recover http.ErrAbortHandler so the response
					// to the client is aborted, this should not be logged
					panic(p)
				}

				slog.ErrorContext(ctx, "panic recovered", slog.Any("error", p), slog.String("stack", string(debug.Stack())))

				apiErr := Error{
					Code:   http.StatusInternalServerError,
					Detail: fmt.Sprint(p),
					Title:  http.StatusText(http.StatusInternalServerError),
					Type:   "conveyor/api/v1/InternalServerError",
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
