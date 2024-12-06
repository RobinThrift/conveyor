package testhelper

import (
	"context"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
)

func NewTestSQLite(ctx context.Context, t *testing.T) *sqlite.SQLite {
	t.Helper()

	db := &sqlite.SQLite{
		File:    ":memory:",
		Timeout: time.Second,
	}

	err := db.Open()
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { db.Close() })

	err = sqlite.RunMigrations(ctx, sqlite.MigrationConfig{LogFormat: "console", LogLevel: "debug"}, db.DB)
	if err != nil {
		t.Fatal(err)
	}

	return db
}
