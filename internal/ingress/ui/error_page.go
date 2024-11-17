package ui

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/ui"
	"github.com/gorilla/csrf"
)

func (router *router) renderErrorPage(w http.ResponseWriter, r *http.Request, errToShow error) {
	slog.ErrorContext(r.Context(), errToShow.Error(), slog.Any("error", errToShow))

	pagedata := ui.PageData{
		AssetURL:  joinPath(router.config.BasePath, "/assets"),
		CSRFToken: csrf.Token(r),
		BaseURL:   router.config.BasePath,
		ServerData: ui.ServerData{
			Error: &ui.UIError{
				Code:   http.StatusInternalServerError,
				Title:  "Unknown Error",
				Detail: errToShow.Error(),
			},
		},
	}

	var uiError *ui.UIError
	if errors.As(errToShow, &uiError) {
		pagedata.ServerData.Error = uiError
	}

	if errors.Is(errToShow, auth.ErrUnauthorized) {
		pagedata.ServerData.Error = &ui.UIError{
			Code:  http.StatusUnauthorized,
			Title: "Unauthorized",
		}
	}

	pagedata.Title = pagedata.ServerData.Error.Title

	w.WriteHeader(pagedata.ServerData.Error.Code)

	err := ui.RenderErrorPage(w, pagedata)
	if err != nil {
		slog.ErrorContext(r.Context(), "error rendering Error page", slog.Any("error", err))
	}
}

func (router *router) csrfErrorHandler(w http.ResponseWriter, r *http.Request) {
	slog.ErrorContext(r.Context(), "csrf error: "+r.URL.String(), slog.String("method", r.Method), slog.Any("error", csrf.FailureReason(r)))
	http.Redirect(w, r, r.URL.String(), http.StatusSeeOther)
}
