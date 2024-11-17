package ui

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/server/session"
	"github.com/RobinThrift/belt/ui"
)

const accountForChangingPassword = "account_for_changing_password"

// [GET] /login/change_password
func (router *router) getChangePassword(w http.ResponseWriter, r *http.Request) error {
	_, ok := session.Get[*auth.Account](r.Context(), accountForChangingPassword)
	if !ok {
		router.redirectTo(w, r, "login")
		return nil
	}

	redirectURL := router.getRedirectURL(r)

	return router.renderUI(w, r, ui.PageData{
		Title: "Change Password",
		ServerData: ui.ServerData{
			Components: ui.ServerDataComponents{
				LoginChangePasswordPage: ui.LoginChangePasswordPage{
					RedirectURL: redirectURL,
				},
			},
		},
	})
}

// [POST] /login/change_password
func (router *router) postChangePassord(w http.ResponseWriter, r *http.Request) error {
	redirectURL := router.getRedirectURL(r)

	account, ok := session.Get[*auth.Account](r.Context(), accountForChangingPassword)
	if !ok || account == nil {
		router.redirectTo(w, r, "login")
		return nil
	}

	if err := r.ParseForm(); err != nil {
		return &ui.UIError{
			Code:   http.StatusBadRequest,
			Title:  "Error parsing form data",
			Detail: err.Error(),
		}
	}

	if validationErr := validateChangePasswordForm(r.Form); len(validationErr) != 0 {
		return router.renderUI(w, r, ui.PageData{
			Title: "Change Password",
			ServerData: ui.ServerData{
				Components: ui.ServerDataComponents{
					LoginChangePasswordPage: ui.LoginChangePasswordPage{
						RedirectURL:      redirectURL,
						ValidationErrors: validationErr,
					},
				},
			},
		})
	}

	currentPassword := r.Form.Get("current_password")
	newPassword := r.Form.Get("new_password")

	err := router.authCtrl.ChangeAccountPassword(
		r.Context(),
		control.ChangeAccountPasswordCmd{
			Account:             account,
			CurrPasswdPlaintext: auth.PlaintextPassword(currentPassword),
			NewPasswdPlaintext:  auth.PlaintextPassword(newPassword),
		},
	)
	if err != nil {
		if errors.Is(err, control.ErrInvalidCredentials) {
			return router.renderUI(w, r, ui.PageData{
				Title: "Change Password",
				ServerData: ui.ServerData{
					Components: ui.ServerDataComponents{
						LoginChangePasswordPage: ui.LoginChangePasswordPage{
							RedirectURL:      redirectURL,
							ValidationErrors: map[string]string{"form": err.Error()},
						},
					},
				},
			})
		}

		return err
	}

	err = session.Destroy(r.Context())
	if err != nil {
		return fmt.Errorf("error destroying session: %w", err)
	}

	err = session.RenewToken(r.Context())
	if err != nil {
		return fmt.Errorf("error renewing session token: %w", err)
	}

	router.redirectTo(w, r, redirectURL)
	return nil
}

func validateChangePasswordForm(form url.Values) map[string]string {
	currentPassword := form.Get("current_password")
	newPassword := form.Get("new_password")
	repeateNewPassword := form.Get("repeat_new_password")

	if currentPassword == "" {
		return map[string]string{"current_password": "please enter current password"}
	}

	if newPassword == "" {
		return map[string]string{"new_password": "please enter a new password"}
	}

	if newPassword != repeateNewPassword {
		return map[string]string{"repeat_new_password": "new passwords don't match"}
	}

	if newPassword == currentPassword {
		return map[string]string{"new_password": "new passwords can't be old password"}
	}

	return nil
}
