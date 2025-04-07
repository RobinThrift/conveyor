package app

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"time"

	"go.robinthrift.com/conveyor/internal/version"
)

type pageData struct {
	Title    string
	BaseURL  string
	AssetURL string

	ServerData serverData
}

type serverData struct {
	Error     *uiError    `json:"error,omitempty"`
	BuildInfo uiBuildInfo `json:"buildInfo"`
}

type uiBuildInfo struct {
	Version    string `json:"version"`
	CommitHash string `json:"commitHash"`
	CommitDate string `json:"commitDate"`
	GoVersion  string `json:"goVersion"`
}

type uiError struct {
	Code   int
	Title  string
	Detail string
}

//nolint:gochecknoglobals
var buildInfo = version.GetBuildInfo()

func render(w http.ResponseWriter, data pageData) error {
	var tmpldata struct {
		UIData     template.HTML
		CommitHash string
		AssetURL   string
		Icon       string
		BaseURL    template.HTMLAttr
		Title      string
	}

	data.ServerData.BuildInfo.Version = buildInfo.Version
	data.ServerData.BuildInfo.CommitHash = buildInfo.Hash
	data.ServerData.BuildInfo.CommitDate = buildInfo.Date.Format(time.RFC3339)
	data.ServerData.BuildInfo.GoVersion = buildInfo.GoVersion
	if len(buildInfo.Hash) > 16 {
		tmpldata.CommitHash = buildInfo.Hash[:16]
	} else {
		tmpldata.CommitHash = "dev"
	}

	encoded, err := json.Marshal(data.ServerData) //nolint:musttag
	if err != nil {
		return fmt.Errorf("error marshalling ui data to json: %w", err)
	}

	tmpldata.Title = data.Title
	tmpldata.Icon = "default"
	tmpldata.AssetURL = data.AssetURL
	tmpldata.BaseURL = template.HTMLAttr(`content="` + data.BaseURL + `"`) //nolint:gosec // Non-issue because we control the value
	tmpldata.UIData = template.HTML(encoded)                               //nolint:gosec // Non-issue because we control the value

	return rootTemplate.Execute(w, tmpldata)
}

func renderErrorPage(w http.ResponseWriter, data pageData) error {
	return errorPageTemplate.Execute(w, data)
}

func (ep uiError) Error() string {
	return fmt.Sprintf("%s: %s", ep.Title, ep.Detail)
}
