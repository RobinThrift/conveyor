package app

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"path"
	"strings"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/x/httpmiddleware"
)

type appRouter struct {
	basePath string
}

func New(basePath string, mux *http.ServeMux) {
	router := appRouter{basePath: basePath}

	mux.Handle("/assets/", serveAssets(basePath+"assets/"))

	mux.Handle("/", httpmiddleware.GzipCompression(router.handlerFuncWithErr(func(w http.ResponseWriter, r *http.Request) error {
		w.Header().Add("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Add("Cross-Origin-Embedder-Policy", "require-corp")

		err := router.renderUI(w, pageData{Title: "Belt"})
		if err != nil {
			router.renderErrorPage(w, r, err)
		}

		return nil
	})))
}

func (router *appRouter) handlerFuncWithErr(h func(w http.ResponseWriter, r *http.Request) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			router.renderErrorPage(w, r, err)
		}
	}
}

func (router *appRouter) renderUI(w http.ResponseWriter, data pageData) error {
	data.BaseURL = router.basePath
	data.AssetURL = joinPath(router.basePath, "/assets")

	err := render(w, data)
	if err != nil {
		return fmt.Errorf("error rendering UI template: %w", err)
	}

	return nil
}

func (router *appRouter) renderErrorPage(w http.ResponseWriter, r *http.Request, errToShow error) {
	slog.ErrorContext(r.Context(), errToShow.Error(), slog.Any("error", errToShow))

	pagedata := pageData{
		AssetURL: joinPath(router.basePath, "/assets"),
		BaseURL:  router.basePath,
		ServerData: serverData{
			Error: &uiError{
				Code:   http.StatusInternalServerError,
				Title:  "Unknown Error",
				Detail: errToShow.Error(),
			},
		},
	}

	var uiErr *uiError
	if errors.As(errToShow, &uiErr) {
		pagedata.ServerData.Error = uiErr
	}

	if errors.Is(errToShow, auth.ErrUnauthorized) {
		pagedata.ServerData.Error = &uiError{
			Code:  http.StatusUnauthorized,
			Title: "Unauthorized",
		}
	}

	pagedata.Title = pagedata.ServerData.Error.Title

	w.WriteHeader(pagedata.ServerData.Error.Code)

	err := renderErrorPage(w, pagedata)
	if err != nil {
		slog.ErrorContext(r.Context(), "error rendering Error page", slog.Any("error", err))
	}
}

func joinPath(elem ...string) string {
	var p string

	if !strings.HasPrefix(elem[0], "/") {
		elem[0] = "/" + elem[0]
		p = path.Join(elem...)[1:]
	} else {
		p = path.Join(elem...)
	}

	if strings.HasSuffix(elem[len(elem)-1], "/") && !strings.HasSuffix(p, "/") {
		p += "/"
	}

	return p
}
