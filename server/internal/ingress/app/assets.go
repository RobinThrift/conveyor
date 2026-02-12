//go:build !dev
// +build !dev

package app

import (
	"embed"
	"io/fs"
	"net/http"

	"go.robinthrift.com/conveyor/internal/x/httpmiddleware"
)

//go:embed assets/*
var _assets embed.FS

//nolint:gochecknoglobals
var _corrected, _ = fs.Sub(_assets, "assets")

func serveAssets(prefix string) http.Handler {
	handler := httpmiddleware.Cache(
		httpmiddleware.GzipCompression(
			http.StripPrefix(
				prefix,
				http.FileServer(http.FS(_corrected)),
			),
		),
	)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Add("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Add("Service-Worker-Allowed", "/")
		handler.ServeHTTP(w, r)
	})
}
