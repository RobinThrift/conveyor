package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"go.robinthrift.com/conveyor/internal/auth"
	"go.robinthrift.com/conveyor/internal/control"
	appingress "go.robinthrift.com/conveyor/internal/ingress/app"
	"go.robinthrift.com/conveyor/internal/ingress/authv1"
	"go.robinthrift.com/conveyor/internal/ingress/memosv1"
	"go.robinthrift.com/conveyor/internal/ingress/syncv1"
	"go.robinthrift.com/conveyor/internal/jobs"
	"go.robinthrift.com/conveyor/internal/server"
	"go.robinthrift.com/conveyor/internal/storage/database/sqlite"
	"go.robinthrift.com/conveyor/internal/storage/filesystem"
)

type App struct {
	config Config
	srv    *http.Server
	db     *sqlite.SQLite

	initSetup *initSetup
	jobs      *jobs.System
}

func New(config Config) *App { //nolint:funlen
	db := &sqlite.SQLite{
		File:         config.Database.Path,
		EnableWAL:    config.Database.EnableWAL,
		Timeout:      config.Database.Timeout,
		DebugEnabled: config.Database.DebugEnabled,
	}

	argon2Params := auth.Argon2Params{
		KeyLen:  config.Argon2.KeyLen,
		Memory:  config.Argon2.Memory,
		Threads: config.Argon2.Threads,
		Time:    config.Argon2.Time,
		Version: config.Argon2.Version,
	}

	accountRepo := sqlite.NewAccountRepo(db)
	syncRepo := sqlite.NewSyncRepo(db)
	authTokenRepo := sqlite.NewAuthTokenRepo(db)
	apiTokenRepo := sqlite.NewAPITokenRepo(db)
	jobRepo := sqlite.NewJobRepo(db)

	blobs := &filesystem.LocalFSBlobStorage{
		BaseDir: config.Blobs.Dir,
		TmpDir:  os.TempDir(),
	}

	authConfig := control.AuthConfig{
		Argon2Params: argon2Params,
		//nolint:mnd // config values
		AuthTokenLength:           32,
		AccessTokenValidDuration:  config.AccessTokenValidDuration,
		RefreshTokenValidDuration: config.RefreshTokenValidDuration,
	}

	accountCtrl := control.NewAccountController(db, accountRepo)
	attachmentCtrl := control.NewAttachmentController(blobs)
	syncCtrl := control.NewSyncController(db, syncRepo, accountCtrl, attachmentCtrl, blobs)
	authCtrl := control.NewAuthController(authConfig, db, accountCtrl, authTokenRepo)
	apiTokenCtrl := control.NewAPITokenController(authConfig, db, apiTokenRepo, authTokenRepo)

	jobSystem := jobs.NewSystem(db, jobRepo, accountCtrl, time.Now, jobFuncs)

	mux := http.NewServeMux()
	srv := server.New(server.Config{Addr: config.Addr}, mux)

	authv1.New(config.BasePath, mux, authCtrl, accountCtrl, apiTokenCtrl)
	syncv1.New(syncv1.RouterConfig{
		BasePath: config.BasePath,
	}, mux, syncCtrl, authCtrl, http.Dir(config.Blobs.Dir))
	memosv1.New(config.BasePath, mux, syncCtrl, authCtrl)
	appingress.New(config.BasePath, mux)

	return &App{
		config: config,
		srv:    srv,
		db:     db,
		initSetup: newInitSetup(initSetupConfig{
			InitUsername: config.Init.Username,
			InitPassword: auth.PlaintextPassword(config.Init.Password),
			Argon2params: argon2Params,
		}, db, accountCtrl, authCtrl),
		jobs: jobSystem,
	}
}

func (a *App) Start(ctx context.Context) error {
	err := a.db.Open()
	if err != nil {
		return err
	}

	err = sqlite.RunMigrations(ctx, sqlite.MigrationConfig{LogFormat: a.config.Log.Format, LogLevel: a.config.Log.Level}, a.db.DB)
	if err != nil {
		return err
	}

	err = a.initSetup.exec(ctx)
	if err != nil {
		return err
	}

	slog.InfoContext(ctx, fmt.Sprintf("starting server on %v", a.config.Addr))

	err = a.srv.ListenAndServe()
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	return a.db.Close()
}

func (a *App) Stop(ctx context.Context) error {
	slog.InfoContext(ctx, "stopping http server")

	return a.srv.Shutdown(ctx)
}
