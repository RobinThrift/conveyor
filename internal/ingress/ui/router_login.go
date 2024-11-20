package ui

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/server/session"
	"github.com/RobinThrift/belt/ui"
)

// [GET] /login
func (router *router) getLogin(w http.ResponseWriter, r *http.Request) error {
	_, ok := session.Get[*auth.Account](r.Context(), "account")
	if ok {
		router.redirectTo(w, r)
		return nil
	}

	_, ok = session.Get[any](r.Context(), accountForChangingPassword)
	if ok {
		router.redirectTo(w, r, "auth", "change_password")
		return nil
	}

	return router.renderLoginPage(w, r, nil)
}

// [POST] /login
func (router *router) postLogin(w http.ResponseWriter, r *http.Request) error {
	redirectURL := router.getRedirectURL(r)

	if validationErr := validateLoginForm(r.PostForm); len(validationErr) != 0 {
		return router.renderUI(w, r, ui.PageData{
			Title: "Login",
			ServerData: ui.ServerData{
				Components: ui.ServerDataComponents{
					LoginPage: ui.LoginPage{
						RedirectURL:      redirectURL,
						ValidationErrors: validationErr,
					},
				},
			},
		})
	}

	account, err := router.authCtrl.GetAccountForCredentials(r.Context(), control.GetAccountForCredentialsQuery{
		Username: r.PostForm.Get("username"), PlaintextPasswd: auth.PlaintextPassword(r.PostForm.Get("password")),
	})
	if err != nil {
		return err
	}

	err = session.RenewToken(r.Context())
	if err != nil {
		return err
	}

	if account.RequiresPasswordChange {
		session.Put(r.Context(), accountForChangingPassword, account)
		router.redirectTo(w, r, "auth", "change_password")
		return nil
	}

	session.Put(r.Context(), "account", account)

	http.Redirect(w, r, "/", http.StatusFound)
	return nil
}

// [GET] /logout
func (router *router) getLogout(w http.ResponseWriter, r *http.Request) error {
	err := session.Destroy(r.Context())
	if err != nil {
		return fmt.Errorf("error destroying sessions: %w", err)
	}

	router.redirectTo(w, r, "/")
	return nil
}

func (router *router) renderLoginPage(w http.ResponseWriter, r *http.Request, validationErrs map[string]string) error {
	serverData := ui.ServerData{
		Components: ui.ServerDataComponents{
			LoginPage: ui.LoginPage{
				RedirectURL: router.getRedirectURL(r),
			},
		},
	}

	serverData.Components.LoginPage.ValidationErrors = validationErrs

	return router.renderUI(w, r, ui.PageData{
		Title:      "Login",
		ServerData: serverData,
	})
}

func validateLoginForm(form url.Values) map[string]string {
	username := form.Get("username")
	password := form.Get("password")

	if username == "" {
		return map[string]string{"username": "username must not be empty"}
	}

	if password == "" {
		return map[string]string{"password": "password must not be empty"}
	}

	return nil
}
