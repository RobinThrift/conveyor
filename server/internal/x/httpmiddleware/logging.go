package httpmiddleware

import (
	"bufio"
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"
)

// LogRequests logs all incoming requests and will also add the logger to the context of next handler in the chain.
func LogRequests(skipFor []string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for _, s := range skipFor {
				if strings.HasPrefix(r.URL.Path, s) {
					next.ServeHTTP(w, r)

					return
				}
			}

			logFields := []any{slog.String("method", r.Method)}

			wrapped := &statusResponseWriter{w, 200}

			start := time.Now()

			defer func(ctx context.Context) {
				logFields = append(
					logFields,
					slog.Int("status", wrapped.statusCode),
					slog.Float64("response_time_ms", float64(time.Since(start))/float64(time.Millisecond)),
				)

				var log = slog.InfoContext

				if p := recover(); p != nil {
					logFields = append(logFields, slog.Any("error", p))
					log = slog.ErrorContext
				} else if wrapped.statusCode >= http.StatusBadRequest {
					log = slog.ErrorContext
				}

				log(ctx, r.URL.String(), logFields...)
			}(r.Context())

			next.ServeHTTP(wrapped, r)
		})
	}
}

type statusResponseWriter struct {
	http.ResponseWriter

	statusCode int
}

func (srw *statusResponseWriter) WriteHeader(statusCode int) {
	srw.ResponseWriter.WriteHeader(statusCode)
	srw.statusCode = statusCode
}

func (srw *statusResponseWriter) Unwrap() http.ResponseWriter {
	return srw.ResponseWriter
}

// Implements http.Hijack if the wrapped connection implements the interface.
func (srw *statusResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	h, ok := srw.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("underlying http.ResponseWriter does not implement http.Hijacker") //nolint:err113
	}

	return h.Hijack()
}

func (srw *statusResponseWriter) Flush() {
	if fl, ok := srw.ResponseWriter.(http.Flusher); ok {
		if srw.statusCode == 0 {
			srw.WriteHeader(http.StatusOK)
		}

		fl.Flush()
	}
}
