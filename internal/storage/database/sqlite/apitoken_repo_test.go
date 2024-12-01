package sqlite

import (
	"context"
	"encoding/base64"
	"fmt"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAPITokenRepo_CRUD(t *testing.T) {
	numTokens := 100

	createTokens := func(ctx context.Context, t *testing.T, repo *APITokenRepo) {
		for i := 0; i < numTokens; i++ {
			err := repo.CreateAPIToken(ctx, &auth.APIToken{
				AccountID: auth.AccountID(1),
				Name:      fmt.Sprintf("%s_%d", t.Name(), i),
				Value:     []byte(fmt.Sprintf("%s_%d", t.Name(), i)),
				ExpiresAt: time.Now().Add(time.Hour * 24),
			})
			require.NoError(t, err)
		}
	}

	t.Run("GetAPIToken", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		t.Cleanup(cancel)

		repo := setupAPITokenRepo(ctx, t)
		createTokens(ctx, t, repo)

		token, err := repo.GetAPIToken(ctx, auth.APITokenValue(t.Name()+"_1"))
		require.NoError(t, err)
		require.NotNil(t, token)
	})

	t.Run("GetAPIToken/Not Found", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		t.Cleanup(cancel)

		repo := setupAPITokenRepo(ctx, t)
		createTokens(ctx, t, repo)

		token, err := repo.GetAPIToken(ctx, auth.APITokenValue("INVALID_TOKEN_VALUE"))
		require.ErrorIs(t, err, auth.ErrAPITokenNotFound)
		require.Nil(t, token)
	})

	t.Run("ListAPITokens", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		t.Cleanup(cancel)

		repo := setupAPITokenRepo(ctx, t)
		createTokens(ctx, t, repo)

		var lastTokenID *int64
		var lastTokenValue string
		total := 0
		for i := 0; i < numTokens; i += 25 {
			q := auth.ListAPITokenQuery{
				PageSize:  25,
				PageAfter: lastTokenID,
			}

			list, err := repo.ListAPITokens(ctx, auth.AccountID(1), q)
			require.NoError(t, err, i)

			assert.Lenf(t, list.Items, 25, "i = %d", i)
			assert.NotEqualf(t, lastTokenValue, base64.URLEncoding.EncodeToString(list.Items[0].Value), "i = %d", i)
			lastTokenValue = base64.URLEncoding.EncodeToString(list.Items[len(list.Items)-1].Value)
			lastTokenID = list.Next
			total += len(list.Items)
		}

		assert.Equal(t, numTokens, total)
	})

	t.Run("DeleteAPIToken", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		t.Cleanup(cancel)

		repo := setupAPITokenRepo(ctx, t)
		createTokens(ctx, t, repo)

		value := auth.APITokenValue(t.Name() + "_10")

		token, err := repo.GetAPIToken(ctx, value)
		require.NoError(t, err)
		require.NotNil(t, token)

		err = repo.DeleteAPIToken(ctx, auth.AccountID(1), t.Name()+"_10")
		require.NoError(t, err)

		token, err = repo.GetAPIToken(ctx, value)
		require.ErrorIs(t, err, auth.ErrAPITokenNotFound)
		require.Nil(t, token)
	})
}

func setupAPITokenRepo(ctx context.Context, t *testing.T) *APITokenRepo {
	t.Helper()
	db := newTestDB(ctx, t)

	accountRepo := NewAccountRepo(db)

	err := accountRepo.Create(ctx, &auth.Account{Username: "user", DisplayName: "user", IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return NewAPITokenRepo(db)
}
