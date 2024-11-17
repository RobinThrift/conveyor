package sqlite

import (
	"context"
	"testing"
	"time"
)

func newTestDB(ctx context.Context, t *testing.T) *SQLite {
	t.Helper()

	db := &SQLite{
		File:    t.TempDir() + "/" + t.Name() + ".db",
		Timeout: time.Second,
	}

	err := db.Open()
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { db.Close() })

	err = RunMigrations(ctx, MigrationConfig{LogFormat: "console", LogLevel: "debug"}, db.DB)
	if err != nil {
		t.Fatal(err)
	}

	return db
}
