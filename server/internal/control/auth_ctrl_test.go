package control

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database/sqlite"
	"go.robinthrift.com/belt/internal/testhelper"
)

func TestAuthController_CreateAuthTokenUsingCredentials(t *testing.T) { //nolint:paralleltest // @TODO: check why these fail when run in parallel
	authCtrl := setupAuthController(t)
	username := t.Name()
	passwd := auth.PlaintextPassword(t.Name())
	t.Run("Valid Credentials", func(t *testing.T) { //nolint:paralleltest // @TODO: check why these fail when run in parallel
		token, err := authCtrl.CreateAuthTokenUsingCredentials(t.Context(), CreateAuthTokenUsingCredentialsCmd{
			Username:        username,
			PlaintextPasswd: passwd,
		})
		require.NoError(t, err)

		assert.Len(t, token.Plaintext.Value, 32)
		assert.Len(t, token.RefreshPlaintext.Value, 32)

		assert.Contains(t, token.Plaintext.Export(), "$")
		assert.Contains(t, token.RefreshPlaintext.Export(), "$")

		assert.True(t, token.ExpiresAt.After(time.Now()))
		assert.True(t, token.RefreshExpiresAt.After(time.Now()))
	})

	t.Run("Invalid Username", func(t *testing.T) { //nolint:paralleltest // @TODO: check why these fail when run in parallel
		token, err := authCtrl.CreateAuthTokenUsingCredentials(t.Context(), CreateAuthTokenUsingCredentialsCmd{
			Username:        "incorrect_username",
			PlaintextPasswd: passwd,
		})
		require.ErrorIs(t, err, ErrInvalidCredentials)
		assert.Nil(t, token)
	})

	t.Run("Invalid Password", func(t *testing.T) { //nolint:paralleltest // @TODO: check why these fail when run in parallel
		token, err := authCtrl.CreateAuthTokenUsingCredentials(t.Context(), CreateAuthTokenUsingCredentialsCmd{
			Username:        username,
			PlaintextPasswd: auth.PlaintextPassword("incorrect password"),
		})
		require.ErrorIs(t, err, ErrInvalidCredentials)
		assert.Nil(t, token)
	})
}

func TestAuthController_CreateAuthTokenUsingRefreshToken(t *testing.T) {
	t.Parallel()

	authCtrl := setupAuthController(t)

	token, err := authCtrl.CreateAuthTokenUsingCredentials(t.Context(), CreateAuthTokenUsingCredentialsCmd{
		Username:        t.Name(),
		PlaintextPasswd: auth.PlaintextPassword(t.Name()),
	})
	require.NoError(t, err)

	refreshed, err := authCtrl.CreateAuthTokenUsingRefreshToken(t.Context(), CreateAuthTokenUsingRefreshTokenCmd{
		PlaintextRefreshToken: token.RefreshPlaintext,
	})
	require.NoError(t, err)

	assert.Contains(t, refreshed.Plaintext.Export(), "$")
	assert.Contains(t, refreshed.RefreshPlaintext.Export(), "$")
	assert.True(t, refreshed.ExpiresAt.After(token.ExpiresAt))
	assert.True(t, refreshed.RefreshExpiresAt.After(token.ExpiresAt))

	_, err = authCtrl.CreateAuthTokenUsingRefreshToken(t.Context(), CreateAuthTokenUsingRefreshTokenCmd{
		PlaintextRefreshToken: token.Plaintext,
	})
	require.ErrorIs(t, err, ErrInvalidCredentials)
}

func setupAuthController(t *testing.T) *AuthController {
	t.Helper()

	db := testhelper.NewInMemTestSQLite(t)

	accountRepo := sqlite.NewAccountRepo(db)
	authTokenRepo := sqlite.NewAuthTokenRepo(db)

	config := AuthConfig{
		Argon2Params:              auth.Argon2Params{KeyLen: 32, Memory: 8192, Threads: 2, Time: 1},
		AuthTokenLength:           32,
		AccessTokenValidDuration:  time.Hour,
		RefreshTokenValidDuration: time.Hour * 2,
	}

	authCtrl := NewAuthController(config, db, NewAccountController(db, accountRepo), authTokenRepo)

	err := authCtrl.CreateAccount(t.Context(), CreateAccountCmd{
		Account: &domain.Account{
			Username: t.Name(),
		},
		PlaintextPasswd: auth.PlaintextPassword(t.Name() + "_init"),
	})
	if err != nil {
		t.Fatalf("error creating account: %v", err)
	}

	err = authCtrl.ChangeAccountPassword(t.Context(), ChangeAccountPasswordCmd{
		Username:            t.Name(),
		CurrPasswdPlaintext: auth.PlaintextPassword(t.Name() + "_init"),
		NewPasswdPlaintext:  auth.PlaintextPassword(t.Name()),
	})
	if err != nil {
		t.Fatalf("error changin account password: %v", err)
	}

	return authCtrl
}
