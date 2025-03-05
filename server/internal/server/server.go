package server

import (
	"log/slog"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.robinthrift.com/belt/internal/x/httpmiddleware"
)

type Config struct {
	Addr string
}

func New(c Config, mux *http.ServeMux) *http.Server {
	mux.Handle("/health", http.HandlerFunc(healthEndpointHandler))
	mux.Handle("/metrics", promhttp.Handler())

	handler := httpmiddleware.LogRequests([]string{"/assets"})(mux)
	handler = httpmiddleware.TraceRequest()(handler)
	handler = httpmiddleware.SetRequestID(handler)

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
