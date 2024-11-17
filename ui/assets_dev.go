//go:build dev
// +build dev

package ui

import (
	"net/http"
	"net/http/httputil"
	"net/url"
)

var viteURL, _ = url.Parse("http://localhost:6155")

var proxy = httputil.NewSingleHostReverseProxy(viteURL)

func Assets(prefix string) http.Handler {
	return proxy
}
