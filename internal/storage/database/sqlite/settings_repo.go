package sqlite

import (
	"cmp"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
)

type settingsJSON struct {
	LocaleLanguage            string `json:"locale.language,omitempty"`
	LocaleRegion              string `json:"locale.region,omitempty"`
	ThemeColourScheme         string `json:"theme.colourScheme,omitempty"`
	ThemeMode                 string `json:"theme.mode,omitempty"`
	ThemeIcon                 string `json:"theme.icon,omitempty"`
	ThemeListLayout           string `json:"theme.listLayout,omitempty"`
	ControlsVim               bool   `json:"controls.vim,omitempty"`
	ControlsDoubleClickToEdit bool   `json:"controls.DoubleClickToEdit,omitempty"`
}

type SettingsRepo struct {
	db database.Database
}

func NewSettingsRepo(db database.Database) *SettingsRepo {
	return &SettingsRepo{db}
}

func (r *SettingsRepo) Get(ctx context.Context, accountID auth.AccountID) (*domain.Settings, error) {
	settings := domain.DefaultSettings

	row, err := queries.GetSettings(ctx, r.db.Conn(ctx), int64(accountID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &settings, nil
		}
		return nil, err
	}

	var value settingsJSON

	err = row.Value.Unmarshal(&value)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling settings JSON: %w", err)
	}

	settings.Locale.Language = cmp.Or(value.LocaleLanguage, settings.Locale.Language)
	settings.Locale.Region = cmp.Or(value.LocaleRegion, settings.Locale.Region)

	settings.Theme.ColourScheme = cmp.Or(value.ThemeColourScheme, settings.Theme.ColourScheme)
	settings.Theme.Mode = cmp.Or(value.ThemeMode, settings.Theme.Mode)
	settings.Theme.Icon = cmp.Or(value.ThemeIcon, settings.Theme.Icon)
	settings.Theme.ListLayout = cmp.Or(value.ThemeListLayout, settings.Theme.ListLayout)

	settings.Controls.Vim = cmp.Or(value.ControlsVim, settings.Controls.Vim)
	settings.Controls.DoubleClickToEdit = cmp.Or(value.ControlsDoubleClickToEdit, settings.Controls.DoubleClickToEdit)

	return &settings, nil
}

func (r *SettingsRepo) Set(ctx context.Context, accountID auth.AccountID, settings *domain.Settings) error {
	err := queries.UpsertSetting(ctx, r.db.Conn(ctx), sqlc.UpsertSettingParams{
		AccountID: int64(accountID),
		Key:       "settings",
		Value: types.NewSQLiteJSON(settingsJSON{
			LocaleLanguage:            settings.Locale.Language,
			LocaleRegion:              settings.Locale.Region,
			ThemeColourScheme:         settings.Theme.ColourScheme,
			ThemeMode:                 settings.Theme.Mode,
			ThemeIcon:                 settings.Theme.Icon,
			ThemeListLayout:           settings.Theme.ListLayout,
			ControlsVim:               settings.Controls.Vim,
			ControlsDoubleClickToEdit: settings.Controls.DoubleClickToEdit,
		}),
	})
	if err != nil {
		return err
	}

	return nil
}
