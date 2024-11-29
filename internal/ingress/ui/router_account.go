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

// [POST] /settings/account/update
func (router *router) postAccountUpdateInfo(w http.ResponseWriter, r *http.Request) error {
	if err := r.ParseForm(); err != nil {
		return &ui.UIError{
			Code:   http.StatusBadRequest,
			Title:  "Error parsing form data",
			Detail: err.Error(),
		}
	}

	if validationErr := validateUpdateAccountInfoForm(r.PostForm); len(validationErr) != 0 {
		return router.renderUI(w, r, ui.PageData{
			ServerData: ui.ServerData{
				Components: ui.ServerDataComponents{
					SettingsPage: ui.SettingsPage{
						ValidationErrors: validationErr,
					},
				},
			},
		})
	}

	cmd := control.UpdateAccountInfoCmd{
		DisplayName: &[]string{r.PostForm.Get("display_name")}[0],
	}

	err := router.accountCtrl.UpdateAccountInfo(r.Context(), cmd)
	if err != nil {
		return err
	}

	err = session.RenewToken(r.Context())
	if err != nil {
		return fmt.Errorf("error renewing session token: %w", err)
	}

	router.redirectTo(w, r, "settings", "account")
	return nil
}

// [POST] /settings/account/change_password
func (router *router) postAccountChangePassword(w http.ResponseWriter, r *http.Request) error {
	account := auth.AccountFromCtx(r.Context())
	if account == nil {
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

	if validationErr := validateChangePasswordForm(r.PostForm); len(validationErr) != 0 {
		return router.renderUI(w, r, ui.PageData{
			ServerData: ui.ServerData{
				Components: ui.ServerDataComponents{
					SettingsPage: ui.SettingsPage{
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
				ServerData: ui.ServerData{
					Components: ui.ServerDataComponents{
						SettingsPage: ui.SettingsPage{
							ValidationErrors: map[string]string{"current_password": "CurrentPasswordIncorrect"},
						},
					},
				},
			})
		}

		return err
	}

	err = session.RenewToken(r.Context())
	if err != nil {
		return fmt.Errorf("error renewing session token: %w", err)
	}

	router.redirectTo(w, r, "settings", "account")
	return nil
}

func validateUpdateAccountInfoForm(form url.Values) map[string]string {
	newDisplayName := form.Get("display_name")

	if newDisplayName == "" {
		return map[string]string{"display_name": "EmptyDisplayName"}
	}

	return nil
}
