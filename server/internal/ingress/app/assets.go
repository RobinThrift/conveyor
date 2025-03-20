//go:build !dev
// +build !dev

package app

import (
	"embed"
	"io/fs"
	"net/http"

	"go.robinthrift.com/belt/internal/x/httpmiddleware"
)

//go:embed assets/*
var _assets embed.FS

var _corrected, _ = fs.Sub(_assets, "assets")

func serveAssets(prefix string) http.Handler {
	handler := httpmiddleware.GzipCompression(http.StripPrefix(prefix, http.FileServer(http.FS(_corrected))))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Add("Cross-Origin-Embedder-Policy", "require-corp")
		handler.ServeHTTP(w, r)
	})
}
