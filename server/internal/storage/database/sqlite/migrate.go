package sqlite

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"log/slog"

	"github.com/pressly/goose/v3"
	"go.robinthrift.com/conveyor/internal/logging"

	_ "modernc.org/sqlite" // blank import because DB driver
)

//go:embed migrations/*.sql
var migrations embed.FS

type MigrationConfig struct {
	LogLevel  string
	LogFormat string
}

func RunMigrations(ctx context.Context, config MigrationConfig, db *sql.DB) error {
	slog.InfoContext(ctx, "running migrations")

	goose.SetBaseFS(migrations)

	err := goose.SetDialect("sqlite3")
	if err != nil {
		panic(err)
	}

	handler, level, err := logging.NewHandler(config.LogLevel, config.LogFormat)
	if err != nil {
		return err
	}

	goose.SetLogger(slog.NewLogLogger(handler, level))

	goose.SetTableName("migrations")

	err = goose.UpContext(ctx, db, "migrations")
	if err != nil {
		return fmt.Errorf("error running migrations: %w", err)
	}

	slog.InfoContext(ctx, "successfully ran migrations")

	return nil
}
