package ui

import (
	"cmp"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/server"
	"github.com/RobinThrift/belt/internal/server/session"
	"github.com/RobinThrift/belt/ui"
	"github.com/gorilla/csrf"
)

type router struct {
	authCtrl     *control.AuthController
	settingsCtrl *control.SettingsControl
	accountCtrl  *control.AccountControl
	config       Config
}

type Config struct {
	CSRFSecret       []byte
	UseSecureCookies bool
	BasePath         string
	AttachmentsDir   string
}

func NewRouter(config Config, mux *http.ServeMux, authCtrl *control.AuthController, settingsCtrl *control.SettingsControl, accountCtrl *control.AccountControl) {
	router := &router{authCtrl, settingsCtrl, accountCtrl, config}

	csrfProtectionMiddleware := csrf.Protect(
		config.CSRFSecret,
		csrf.Secure(config.UseSecureCookies),
		csrf.FieldName("belt.csrf.token"),
		csrf.CookieName("belt_csrf_token"),
		csrf.Path(config.BasePath),
		csrf.ErrorHandler(http.HandlerFunc(router.csrfErrorHandler)),
	)

	mux.Handle("/", csrfProtectionMiddleware(router.ensureLoggedIn(router.handlerFuncWithErr(func(w http.ResponseWriter, r *http.Request) error {
		err := router.renderUI(w, r, ui.PageData{Title: "Belt"})
		if err != nil {
			router.renderErrorPage(w, r, err)
		}
		return nil
	}))))

	mux.Handle(config.BasePath+"assets/manifest.json", server.CompressWithGzipMiddleware(http.HandlerFunc(router.serveManifestJSON)))

	mux.Handle("/assets/", server.CompressWithGzipMiddleware(ui.Assets(config.BasePath+"assets/")))
	mux.Handle(
		config.BasePath+"attachments/",
		server.CompressWithGzipMiddleware(
			http.StripPrefix(
				config.BasePath+"attachments/",
				http.FileServer(http.Dir(config.AttachmentsDir)),
			),
		),
	)

	mux.Handle("GET /login", csrfProtectionMiddleware(router.handlerFuncWithErr((router.getLogin))))
	mux.Handle("POST /login", csrfProtectionMiddleware(router.handlerFuncWithErr(router.postLogin)))

	mux.Handle("GET /auth/change_password", csrfProtectionMiddleware(router.handlerFuncWithErr((router.getChangePassword))))
	mux.Handle("POST /auth/change_password", csrfProtectionMiddleware(router.handlerFuncWithErr(router.postChangePassword)))

	mux.Handle("POST /settings/account/update_info", csrfProtectionMiddleware(router.ensureLoggedIn(router.handlerFuncWithErr(router.postAccountUpdateInfo))))
	mux.Handle("POST /settings/account/change_password", csrfProtectionMiddleware(router.ensureLoggedIn(router.handlerFuncWithErr(router.postAccountChangePassword))))

	mux.Handle("GET /logout", router.handlerFuncWithErr(router.getLogout))
}

func (router *router) handlerFuncWithErr(h func(w http.ResponseWriter, r *http.Request) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			router.renderErrorPage(w, r, err)
		}
	}
}

func (router *router) renderUI(w http.ResponseWriter, r *http.Request, data ui.PageData) error {
	data.BaseURL = router.config.BasePath
	data.AssetURL = joinPath(router.config.BasePath, "/assets")
	data.Icon = "default"
	data.CSRFToken = csrf.Token(r)
	data.ServerData.Settings = ui.NewSettings(&domain.DefaultSettings)

	if account := auth.AccountFromCtx(r.Context()); account != nil {
		data.ServerData.Account = &ui.Account{
			Username:    account.Username,
			DisplayName: account.DisplayName,
		}

		settings, err := router.settingsCtrl.Get(r.Context())
		if err != nil {
			return err
		}

		data.ServerData.Settings = ui.NewSettings(settings)

		data.Icon = cmp.Or(settings.Theme.Icon, data.Icon)
	}

	err := ui.Render(w, data)
	if err != nil {
		return fmt.Errorf("error rendering UI template: %w", err)
	}

	return nil
}

func (router *router) serveManifestJSON(w http.ResponseWriter, r *http.Request) {
	icon := "default"

	if account := auth.AccountFromCtx(r.Context()); account != nil {
		settings, err := router.settingsCtrl.Get(r.Context())
		if err != nil {
			slog.ErrorContext(r.Context(), "error getting user settings", slog.Any("error", err))
			w.WriteHeader(http.StatusInternalServerError)
		}

		icon = cmp.Or(settings.Theme.Icon, icon)
	}

	manifestJSON := &manifest{
		Name:            "Belt",
		ShortName:       "Belt",
		StartURL:        router.config.BasePath,
		BackgroundColor: "transparent",
		ThemeColor:      "transparent",
		Display:         "standalone",
		Icons: []manifestIcon{
			{
				Src:   router.config.BasePath + "icons/" + icon + "/pwa-64x64.png",
				Sizes: "64x64",
				Type:  "image/png",
			},
			{
				Src:   router.config.BasePath + "icons/" + icon + "/pwa-192x192.png",
				Sizes: "192x192",
				Type:  "image/png",
			},
			{
				Src:   router.config.BasePath + "icons/" + icon + "/pwa-512x512.png",
				Sizes: "512x512",
				Type:  "image/png",
			},
			{
				Src:     router.config.BasePath + "icons/" + icon + "/maskable-icon-512x512.png",
				Sizes:   "512x512",
				Type:    "image/png",
				Purpose: "maskable",
			},
		},
	}

	body, err := json.Marshal(manifestJSON)
	if err != nil {
		slog.ErrorContext(r.Context(), "error marshalling manifest to json", slog.Any("error", err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Add("Content-Type", "application/manifest+json")
	_, _ = w.Write(body)
}

func (router *router) ensureLoggedIn(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		account, ok := session.Get[*auth.Account](r.Context(), "account")
		if !ok {
			router.redirectTo(w, r, "login")
			return
		}
		ctx := auth.CtxWithAccount(r.Context(), account)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type manifest struct {
	Name            string         `json:"name"`
	ShortName       string         `json:"short_name"`
	StartURL        string         `json:"start_url"`
	BackgroundColor string         `json:"background_color"`
	ThemeColor      string         `json:"theme_color"`
	Display         string         `json:"display"`
	Icons           []manifestIcon `json:"icons"`
}

type manifestIcon struct {
	Src     string `json:"src"`
	Sizes   string `json:"sizes"`
	Type    string `json:"type"`
	Purpose string `json:"purpose,omitempty"`
}
