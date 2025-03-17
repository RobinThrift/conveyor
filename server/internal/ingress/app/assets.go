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

var _corrected, _ = fs.Sub(_assets, "build")

func serveAssets(prefix string) http.Handler {
	return httpmiddleware.GzipCompression(http.StripPrefix(prefix, http.FileServer(http.FS(_corrected))))
}
