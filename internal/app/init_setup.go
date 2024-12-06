package app

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/storage/database"
)

type initSetupConfig struct {
	InitUsername string
	InitPassword auth.PlaintextPassword
	Argon2params auth.Argon2Params
}

type initSetup struct {
	config   initSetupConfig
	tx       database.Transactioner
	accCtrl  *control.AccountControl
	authCtrl *control.AuthController
}

func newInitSetup(config initSetupConfig, tx database.Transactioner, accCtrl *control.AccountControl, authCtrl *control.AuthController) *initSetup {
	return &initSetup{config, tx, accCtrl, authCtrl}
}

func (isj *initSetup) exec(ctx context.Context) error {
	return isj.tx.InTransaction(ctx, func(ctx context.Context) error {
		err := isj.run(ctx)
		if err != nil {
			return fmt.Errorf("error executing initial setup job: %w", err)
		}

		return nil
	})
}

func (isj *initSetup) run(ctx context.Context) error {
	skipInitSetup, err := isj.skipInitSetup(ctx)
	if err != nil {
		return fmt.Errorf("error checking if initial setup should be skipped: %w", err)
	}

	if skipInitSetup {
		slog.DebugContext(ctx, "skipping initial setup: already setup")
		return nil
	}

	slog.InfoContext(ctx, "running initial setup job")

	err = isj.authCtrl.CreateAccount(ctx, control.CreateAccountCmd{
		Account: &auth.Account{
			Username:               isj.config.InitUsername,
			DisplayName:            isj.config.InitUsername,
			IsAdmin:                true,
			RequiresPasswordChange: true,
		},
		PlaintextPasswd: isj.config.InitPassword,
	})
	if err != nil {
		return fmt.Errorf("error creating initial account: %w", err)
	}

	return nil
}

func (isj *initSetup) skipInitSetup(ctx context.Context) (bool, error) {
	count, err := isj.accCtrl.CountAccounts(ctx)
	if err != nil {
		return false, fmt.Errorf("error listing accounts: %w", err)
	}

	if count != 0 {
		return true, nil
	}

	return false, nil
}
