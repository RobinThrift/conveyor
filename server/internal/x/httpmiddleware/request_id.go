package httpmiddleware

import (
	"net/http"

	"go.robinthrift.com/belt/internal/tracing"
)

func SetRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID, ok := tracing.RequestIDFromHeader(r.Header)
		if !ok {
			reqID = tracing.NewRequestID()
		}

		ctx := tracing.RequestIDWithCtx(r.Context(), reqID)
		tracing.AddRequestIDToSpan(ctx)

		if next != nil {
			next.ServeHTTP(w, r.WithContext(ctx))
		}
	})
}
