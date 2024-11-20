package session

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/alexedwards/scs/v2"
)

func NewManager(db database.Database) *scs.SessionManager {
	sm := scs.New()                      //nolint:varnamelen
	sm.Store = sqlite.NewSessionRepo(db) //nolint:contextcheck // false positive IMO
	sm.Lifetime = 24 * time.Hour
	sm.Cookie.Name = "belt_session"
	sm.Cookie.HttpOnly = true
	sm.Cookie.Persist = true
	sm.Cookie.SameSite = http.SameSiteStrictMode
	sm.ErrorFunc = func(w http.ResponseWriter, r *http.Request, err error) {
		slog.ErrorContext(r.Context(), "session storage error", slog.Any("error", err))
		w.WriteHeader(http.StatusInternalServerError)
	}

	return sm
}

type ctxSessMngrKeyType string

const ctxSessMngrKey = ctxSessMngrKeyType("ctxSessionKey")

func CtxWithSessionManager(ctx context.Context, sm *scs.SessionManager) context.Context {
	return context.WithValue(ctx, ctxSessMngrKey, sm)
}

func RenewToken(ctx context.Context) error {
	sm, ok := ctx.Value(ctxSessMngrKey).(*scs.SessionManager)
	if !ok {
		return nil
	}

	return sm.RenewToken(ctx)
}

func Put(ctx context.Context, key string, value any) {
	sm, ok := ctx.Value(ctxSessMngrKey).(*scs.SessionManager)
	if !ok {
		return
	}

	sm.Put(ctx, key, value)
}

func Get[V any](ctx context.Context, key string) (V, bool) {
	var defaultVal V

	sm, ok := ctx.Value(ctxSessMngrKey).(*scs.SessionManager)
	if !ok {
		return defaultVal, false
	}

	val, ok := sm.Get(ctx, key).(V)
	if !ok {
		return defaultVal, false
	}

	return val, true
}

func Pop[V any](ctx context.Context, key string) (V, bool) {
	var defaultVal V

	sm, ok := ctx.Value(ctxSessMngrKey).(*scs.SessionManager)
	if !ok {
		return defaultVal, false
	}

	val, ok := sm.Pop(ctx, key).(V)
	if !ok {
		return defaultVal, false
	}

	return val, true
}

func Remove(ctx context.Context, key string) {
	sm, ok := ctx.Value(ctxSessMngrKey).(*scs.SessionManager)
	if !ok {
		return
	}

	sm.Remove(ctx, key)
}

func Destroy(ctx context.Context) error {
	sm, ok := ctx.Value(ctxSessMngrKey).(*scs.SessionManager)
	if !ok {
		return nil
	}

	return sm.Destroy(ctx)
}
