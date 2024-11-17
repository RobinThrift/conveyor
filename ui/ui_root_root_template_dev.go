//go:build dev
// +build dev

package ui

import (
	_ "embed"
	"html/template"
)

//go:embed src/html/root_dev.tmpl.html
var rootTemplateRaw string

var rootTemplate = template.Must(template.New("root.html").Parse(rootTemplateRaw))
