package sqlite

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRunMigrations(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()

	db := newTestDB(ctx, t)

	err := RunMigrations(ctx, MigrationConfig{LogFormat: "console", LogLevel: "debug"}, db.DB)
	require.NoError(t, err)
}
