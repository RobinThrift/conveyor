//go:build !dev
// +build !dev

package ui

import (
	"embed"
	"html/template"
	"io/fs"
	"net/http"
)

//go:embed build
var _assets embed.FS

var _corrected, _ = fs.Sub(_assets, "build")

func Assets(prefix string) http.Handler {
	return http.StripPrefix(prefix, http.FileServer(http.FS(_corrected)))
}

//go:embed src/html/root.tmpl.html
var rootTemplateRaw string

var rootTemplate = template.Must(template.New("root.html").Parse(rootTemplateRaw))
