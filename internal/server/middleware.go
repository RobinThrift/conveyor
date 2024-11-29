package server

import (
	"bufio"
	"compress/gzip"
	"encoding/gob"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/server/session"
	"github.com/RobinThrift/belt/internal/tracing"
	"github.com/alexedwards/scs/v2"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func sessionMiddleware(sessionManager *scs.SessionManager, skipFor []string) func(next http.Handler) http.Handler {
	gob.Register(&auth.Account{})

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for _, s := range skipFor {
				if strings.HasPrefix(r.URL.Path, s) {
					next.ServeHTTP(w, r)
					return
				}
			}

			ctx := session.CtxWithSessionManager(r.Context(), sessionManager)
			sessionManager.LoadAndSave(next).ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func traceRequestMiddleware(opts ...otelhttp.Option) func(next http.Handler) http.Handler {
	formatter := func(_ string, req *http.Request) string {
		return strings.TrimSuffix(req.URL.Path, "/")
	}

	opts = append(
		opts,
		otelhttp.WithSpanNameFormatter(formatter),
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
	)

	return func(next http.Handler) http.Handler {
		return otelhttp.NewHandler(next, "/", opts...)
	}
}

func setRequestIDMiddleware(next http.Handler) http.Handler {
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

// logRequestsMiddleware logs all incoming requests and will also add the logger to the context of next handler in the chain.
func logRequestsMiddleware(skipFor []string) func(next http.Handler) http.Handler {
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
			defer func() {
				logFields = append(
					logFields,
					slog.Int("status", wrapped.statusCode),
					slog.Float64("response_time_ms", float64(time.Since(start))/float64(time.Millisecond)),
				)

				var log = slog.InfoContext

				if p := recover(); p != nil {
					logFields = append(logFields, slog.Any("error", p))
					log = slog.ErrorContext
				} else if wrapped.statusCode >= 400 {
					log = slog.ErrorContext
				}

				log(r.Context(), r.URL.String(), logFields...)
			}()

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
		return nil, nil, errors.New("underlying http.ResponseWriter does not implement http.Hijacker")
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

type gzipResponseWriter struct {
	http.ResponseWriter
	gz *gzip.Writer
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.gz.Write(b)
}

func CompressWithGzipMiddleware(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") || r.Header.Get("upgrade") != "" {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Encoding", "gzip")

		gz := gzip.NewWriter(w)
		defer gz.Close()
		gzr := gzipResponseWriter{gz: gz, ResponseWriter: w}

		next.ServeHTTP(gzr, r)
	}
}
