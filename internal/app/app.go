package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/ingress/apiv1"
	uiIngress "github.com/RobinThrift/belt/internal/ingress/ui"
	"github.com/RobinThrift/belt/internal/jobs"
	"github.com/RobinThrift/belt/internal/server"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/alexedwards/scs/v2"
)

type App struct {
	config Config
	srv    *http.Server
	db     *sqlite.SQLite

	jobs []jobs.Job
}

func New(config Config) *App {
	db := &sqlite.SQLite{
		File:      config.Database.Path,
		EnableWAL: config.Database.EnableWAL,
		Timeout:   config.Database.Timeout,
	}

	sm := scs.New()                      //nolint:varnamelen
	sm.Store = sqlite.NewSessionRepo(db) //nolint:contextcheck // false positive IMO
	sm.Lifetime = 24 * time.Hour
	sm.Cookie.HttpOnly = true
	sm.Cookie.Persist = true
	sm.Cookie.SameSite = http.SameSiteStrictMode
	sm.ErrorFunc = func(w http.ResponseWriter, r *http.Request, err error) {
		slog.ErrorContext(r.Context(), "session storage error", slog.Any("error", err))
		w.WriteHeader(http.StatusInternalServerError)
	}

	argon2Params := auth.Argon2Params{
		KeyLen:  config.Argon2.KeyLen,
		Memory:  config.Argon2.Memory,
		Threads: config.Argon2.Threads,
		Time:    config.Argon2.Time,
		Version: config.Argon2.Version,
	}

	accountRepo := sqlite.NewAccountRepo(db)
	localAuthRepo := sqlite.NewLocalAuthRepo(db)
	memoRepo := sqlite.NewMemoRepo(db)

	accountCtrl := control.NewAccountController(db, accountRepo)
	authCtrl := control.NewAuthController(control.AuthConfig{
		Argon2Params: argon2Params,
	}, db, accountCtrl, localAuthRepo)
	memoCtrl := control.NewMemoControl(db, memoRepo)

	mux := http.NewServeMux()

	srv := server.New(server.Config{Addr: config.Addr, UseSecureCookies: config.SecureCookies}, mux, sm)

	uiIngress.NewRouter(uiIngress.Config{
		CSRFSecret:       config.CSRFSecret,
		UseSecureCookies: config.SecureCookies,
		BasePath:         config.BasePath,
	}, mux, authCtrl)

	apiv1.New(config.BasePath, mux, memoCtrl)

	return &App{
		config: config,
		srv:    srv,
		db:     db,
		jobs: []jobs.Job{
			jobs.NewInitSetupJob(jobs.InitSetupJobConfig{
				InitUsername: config.Init.Username,
				InitPassword: auth.PlaintextPassword(config.Init.Password),
				Argon2params: argon2Params,
			}, db, accountCtrl, authCtrl),
		}}
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

	for _, job := range a.jobs {
		err = job.Exec(ctx)
		if err != nil {
			return err
		}
	}

	slog.InfoContext(ctx, fmt.Sprintf("starting server on %v", a.config.Addr))
	if err := a.srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	return a.db.Close()
}

func (a *App) Stop(ctx context.Context) error {
	slog.InfoContext(ctx, "stopping http server")
	return a.srv.Shutdown(ctx)
}
