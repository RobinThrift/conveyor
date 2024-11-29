package ui

import (
	"fmt"
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
	}

	err := ui.Render(w, data)
	if err != nil {
		return fmt.Errorf("error rendering UI template: %w", err)
	}

	return nil
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
