package control

import (
	"context"
	"sync"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
)

type SettingsControl struct {
	repo SettingsControlRepo

	mu    sync.Mutex
	cache *domain.Settings
}

type SettingsControlRepo interface {
	Get(ctx context.Context, accountID auth.AccountID) (*domain.Settings, error)
	Set(ctx context.Context, accountID auth.AccountID, settings *domain.Settings) error
}

func NewSettingsControl(repo SettingsControlRepo) *SettingsControl {
	return &SettingsControl{repo: repo}
}

func (sc *SettingsControl) Get(ctx context.Context) (*domain.Settings, error) {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	if sc.cache != nil {
		return sc.cache, nil
	}

	settings, err := sc.repo.Get(ctx, account.ID)
	if err != nil {
		return nil, err
	}

	sc.cache = settings

	return sc.cache, nil
}

type SetSettingsCmd struct {
	LocaleLanguage            *string
	LocaleRegion              *string
	ThemeColourScheme         *string
	ThemeMode                 *string
	ThemeIcon                 *string
	ControlsVim               *bool
	ControlsDoubleClickToEdit *bool
}

func (sc *SettingsControl) Set(ctx context.Context, cmd SetSettingsCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	settings, err := sc.Get(ctx)
	if err != nil {
		return err
	}

	sc.mu.Lock()
	defer sc.mu.Unlock()

	if cmd.LocaleLanguage != nil {
		settings.Locale.Language = *cmd.LocaleLanguage
	}

	if cmd.LocaleRegion != nil {
		settings.Locale.Region = *cmd.LocaleRegion
	}

	if cmd.ThemeColourScheme != nil {
		settings.Theme.ColourScheme = *cmd.ThemeColourScheme
	}

	if cmd.ThemeIcon != nil {
		settings.Theme.Icon = *cmd.ThemeIcon
	}

	if cmd.ThemeMode != nil {
		settings.Theme.Mode = *cmd.ThemeMode
	}

	if cmd.ControlsVim != nil {
		settings.Controls.Vim = *cmd.ControlsVim
	}

	if cmd.ControlsDoubleClickToEdit != nil {
		settings.Controls.DoubleClickToEdit = *cmd.ControlsDoubleClickToEdit
	}

	err = sc.repo.Set(ctx, account.ID, settings)
	if err != nil {
		return err
	}

	sc.cache = settings

	return nil
}
