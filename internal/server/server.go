package server

import (
	"log/slog"
	"net/http"

	"github.com/alexedwards/scs/v2"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Config struct {
	Addr             string
	UseSecureCookies bool
	CSRFSecret       []byte
}

func New(c Config, mux *http.ServeMux, sm *scs.SessionManager) *http.Server {
	mux.Handle("/health", http.HandlerFunc(healthEndpointHandler))
	mux.Handle("/metrics", promhttp.Handler())

	handler := sessionMiddleware(sm, []string{"/assets"})(mux)
	handler = logRequestsMiddleware([]string{"/assets"})(handler)
	handler = traceRequestMiddleware()(handler)
	handler = setRequestIDMiddleware(handler)

	return &http.Server{
		Addr:    c.Addr,
		Handler: handler,
	}
}

func healthEndpointHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte("ok"))
	if err != nil {
		slog.ErrorContext(r.Context(), "error writing response", slog.Any("error", err))
	}
}
