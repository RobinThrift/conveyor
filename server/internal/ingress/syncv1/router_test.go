package syncv1

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/control"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database/sqlite"
	"go.robinthrift.com/belt/internal/storage/filesystem"
	"go.robinthrift.com/belt/internal/testhelper"
)

func TestRouter_Attachments(t *testing.T) {
	mux, token := setupSyncV1Router(t)

	content := "attachment content"

	uploadAttachment := func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/sync/v1/attachments", bytes.NewReader([]byte(content)))
		req.Header.Add(authHeader, "Bearer "+token)
		req.Header.Add("X-Filepath", "a/b/c/d/test")
		w := httptest.NewRecorder()

		mux.ServeHTTP(w, req)

		res := w.Result()
		assert.Equal(t, http.StatusCreated, res.StatusCode)
	}

	t.Run("Get", func(t *testing.T) {
		uploadAttachment(t)

		req := httptest.NewRequest(http.MethodGet, "/blobs/a/b/c/d/test", nil)
		req.Header.Add(authHeader, "Bearer "+token)
		w := httptest.NewRecorder()

		mux.ServeHTTP(w, req)

		res := w.Result()
		body, err := io.ReadAll(res.Body)
		assert.NoError(t, err)
		fmt.Println(res.Header)
		assert.Equal(t, http.StatusOK, res.StatusCode)
		assert.Equal(t, content, string(body))
	})

	t.Run("Not Found", func(t *testing.T) {
		uploadAttachment(t)

		req := httptest.NewRequest(http.MethodGet, "/blobs/a/b/c/d/not_found", nil)
		req.Header.Add(authHeader, "Bearer "+token)
		w := httptest.NewRecorder()

		mux.ServeHTTP(w, req)

		res := w.Result()
		assert.Equal(t, http.StatusNotFound, res.StatusCode)
	})

	t.Run("Invalid Auth", func(t *testing.T) {
		uploadAttachment(t)

		req := httptest.NewRequest(http.MethodGet, "/blobs/a/b/c/d/test", nil)
		req.Header.Add(authHeader, "Bearer INVALID_TOKEN")
		w := httptest.NewRecorder()

		mux.ServeHTTP(w, req)

		res := w.Result()
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})

	t.Run("No Auth", func(t *testing.T) {
		uploadAttachment(t)

		req := httptest.NewRequest(http.MethodGet, "/blobs/a/b/c/d/test", nil)
		w := httptest.NewRecorder()

		mux.ServeHTTP(w, req)

		res := w.Result()
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})
}

func setupSyncV1Router(t *testing.T) (http.Handler, string) {
	db := testhelper.NewInMemTestSQLite(t)

	accountRepo := sqlite.NewAccountRepo(db)
	syncRepo := sqlite.NewSyncRepo(db)
	authTokenRepo := sqlite.NewAuthTokenRepo(db)

	config := control.AuthConfig{
		Argon2Params:              auth.Argon2Params{KeyLen: 32, Memory: 8192, Threads: 2, Time: 1},
		AuthTokenLength:           32,
		AccessTokenValidDuration:  time.Hour,
		RefreshTokenValidDuration: time.Hour * 2,
	}

	blobDir := t.TempDir()

	authCtrl := control.NewAuthController(config, db, control.NewAccountController(db, accountRepo), authTokenRepo)
	syncCtrl := control.NewSyncController(db, syncRepo, &filesystem.LocalFSBlobStorage{
		BaseDir: blobDir,
		TmpDir:  t.TempDir(),
	})

	err := authCtrl.CreateAccount(t.Context(), control.CreateAccountCmd{
		Account: &domain.Account{
			Username: t.Name(),
		},
		PlaintextPasswd: auth.PlaintextPassword(t.Name()),
	})
	if err != nil {
		t.Fatal(err)
	}

	token, err := authCtrl.CreateAuthTokenUsingCredentials(t.Context(), control.CreateAuthTokenUsingCredentialsCmd{
		Username:        t.Name(),
		PlaintextPasswd: auth.PlaintextPassword(t.Name()),
	})
	if err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()

	New(RouterConfig{BasePath: "/"}, mux, syncCtrl, authCtrl, http.Dir(blobDir))

	return mux, token.Plaintext.Export()
}
