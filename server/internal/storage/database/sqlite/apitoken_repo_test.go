package sqlite

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
)

func TestAPITokenRepo_CRUD(t *testing.T) {
	t.Parallel()

	t.Run("GetAPITokenByName", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(t.Context())
		t.Cleanup(cancel)

		setup := setupAPITokenRepo(ctx, t)
		setup.createAPITokens(ctx, 10)

		token, err := setup.repo.GetAPITokenByName(ctx, setup.accountID, fmt.Sprintf("%s_%d", t.Name(), 1))
		require.NoError(t, err)
		require.NotNil(t, token)
	})

	t.Run("GetAPITokenByName/Not Found", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(t.Context())
		t.Cleanup(cancel)

		setup := setupAPITokenRepo(ctx, t)
		setup.createAPITokens(ctx, 10)

		token, err := setup.repo.GetAPITokenByName(ctx, setup.accountID, "UNKNOWN_NAME")
		require.ErrorIs(t, err, domain.ErrAPITokenNotFound)
		require.Nil(t, token)
	})

	t.Run("ListAPITokens", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(t.Context())
		t.Cleanup(cancel)

		numTokens := 100

		setup := setupAPITokenRepo(ctx, t)
		setup.createAPITokens(ctx, numTokens)

		var lastAPITokenID *domain.APITokenID

		var lastReferncesTokenID int64

		total := 0

		for i := 0; i < numTokens; i += 25 {
			q := domain.ListAPITokenQuery{
				PageSize:  25,
				PageAfter: lastAPITokenID,
			}

			list, err := setup.repo.ListAPITokens(ctx, domain.AccountID(1), q)
			require.NoError(t, err, i)

			assert.Lenf(t, list.Items, 25, "i = %d", i)
			assert.NotEqualf(t, lastReferncesTokenID, list.Items[0].TokenID, "i = %d", i)
			lastReferncesTokenID = list.Items[len(list.Items)-1].TokenID
			lastAPITokenID = list.Next
			total += len(list.Items)
		}

		assert.Equal(t, numTokens, total)
	})

	t.Run("DeleteAPIToken", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(t.Context())
		t.Cleanup(cancel)

		setup := setupAPITokenRepo(ctx, t)
		setup.createAPITokens(ctx, 20)

		name := t.Name() + "_10"

		token, err := setup.repo.GetAPITokenByName(ctx, setup.accountID, name)
		require.NoError(t, err)
		require.NotNil(t, token)

		err = setup.repo.DeleteAPITokenByName(ctx, setup.accountID, name)
		require.NoError(t, err)

		token, err = setup.repo.GetAPITokenByName(ctx, setup.accountID, name)
		require.ErrorIs(t, err, domain.ErrAPITokenNotFound)
		require.Nil(t, token)
	})
}

type apiTokenRepoTestSetup struct {
	accountID       domain.AccountID
	repo            *APITokenRepo
	authTokenRepo   *AuthTokenRepo
	createAPITokens func(ctx context.Context, numTokens int) []string
}

func setupAPITokenRepo(ctx context.Context, t *testing.T) apiTokenRepoTestSetup {
	t.Helper()
	db := newTestDB(ctx, t)

	accountRepo := NewAccountRepo(db)

	err := accountRepo.Create(ctx, &domain.Account{Username: t.Name(), Password: domain.AccountPassword{Password: []byte("1234"), Salt: []byte("1234")}})
	if err != nil {
		t.Fatal(err)
	}

	accountID := domain.AccountID(1)

	repo := NewAPITokenRepo(db)
	authTokenRepo := NewAuthTokenRepo(db)

	return apiTokenRepoTestSetup{
		accountID:     accountID,
		repo:          repo,
		authTokenRepo: authTokenRepo,
		createAPITokens: func(ctx context.Context, numTokens int) []string {
			values := make([]string, numTokens)
			for i := range numTokens {
				expiresAt := time.Now().Add(time.Hour * 24)
				plaintextToken, err := auth.NewPlaintextAuthToken(32, expiresAt, expiresAt)
				require.NoError(t, err)

				id, err := authTokenRepo.CreateAuthToken(ctx, &auth.AuthToken{
					AccountID:        domain.AccountID(1),
					Value:            plaintextToken.Plaintext.Value,
					ExpiresAt:        plaintextToken.ExpiresAt,
					RefreshValue:     plaintextToken.RefreshPlaintext.Value,
					RefreshExpiresAt: plaintextToken.RefreshExpiresAt,
				})
				require.NoError(t, err)

				err = repo.CreateAPIToken(ctx, &domain.APIToken{
					AccountID: domain.AccountID(1),
					TokenID:   int64(id),
					Name:      fmt.Sprintf("%s_%d", t.Name(), i),
					ExpiresAt: expiresAt,
				})
				require.NoError(t, err)

				values[i] = plaintextToken.Plaintext.Export()
			}

			return values
		},
	}
}
