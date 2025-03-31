package testhelper

import (
	"strings"
	"testing"
	"time"

	"go.robinthrift.com/conveyor/internal/storage/database/sqlite"
)

func NewInMemTestSQLite(t *testing.T) *sqlite.SQLite {
	t.Helper()

	db := &sqlite.SQLite{
		File:      ":memory:",
		Timeout:   time.Second,
		EnableWAL: true,
	}

	err := db.Open()
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		t.Logf("closing DB for %s: %v", t.Name(), db.Close())
	})

	err = sqlite.RunMigrations(t.Context(), sqlite.MigrationConfig{LogFormat: "console", LogLevel: "debug"}, db.DB)
	if err != nil {
		t.Fatal(err)
	}

	return db
}

// NewFileTestSQLite returns a new SQLite database for tests, using a file instead of an in-memory database.
// In some rare cases tests may fail with in-memory database, especially when using multiple goroutines.
func NewFileTestSQLite(t *testing.T) *sqlite.SQLite {
	t.Helper()

	db := &sqlite.SQLite{
		File:      t.TempDir() + "/" + strings.ReplaceAll(t.Name(), "/", "__") + ".db",
		Timeout:   time.Second,
		EnableWAL: true,
	}

	err := db.Open()
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { db.Close() })

	err = sqlite.RunMigrations(t.Context(), sqlite.MigrationConfig{LogFormat: "console", LogLevel: "debug"}, db.DB)
	if err != nil {
		t.Fatal(err)
	}

	return db
}
