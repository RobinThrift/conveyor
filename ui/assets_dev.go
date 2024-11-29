//go:build dev
// +build dev

package ui

import (
	_ "embed"
	"html/template"
	"net/http"
	"net/http/httputil"
	"net/url"
)

var viteURL, _ = url.Parse("http://localhost:6155")

var proxy = httputil.NewSingleHostReverseProxy(viteURL)

func Assets(prefix string) http.Handler {
	return proxy
}

//go:embed src/html/root_dev.tmpl.html
var rootTemplateRaw string

var rootTemplate = template.Must(template.New("root.html").Parse(rootTemplateRaw))
