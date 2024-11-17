package ui

import (
	"net/http"
	"path"
	"slices"
	"strings"
)

func (router *router) redirectTo(w http.ResponseWriter, r *http.Request, segments ...string) {
	if strings.HasPrefix(segments[0], "http") {
		http.Redirect(w, r, segments[0], http.StatusSeeOther)
		return
	}

	if !(strings.HasPrefix(segments[0], router.config.BasePath)) {
		segments = slices.Insert(segments, 0, router.config.BasePath)
	}

	redirectURL := r.URL.Host + joinPath(segments...)
	if r.URL.Scheme != "" {
		redirectURL = r.URL.Scheme + "://" + redirectURL
	}

	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}

// getRedirectURL from request. If set in query params, it will return that value,
// otherwise will check Form, if available. Will fallback to the DefaultRedirectURI.
func (router *router) getRedirectURL(r *http.Request) string {
	q := r.URL.Query()
	redirectURL := q.Get("redirect_url")

	if redirectURL != "" {
		return redirectURL
	}

	if r.Form != nil {
		redirectURL = r.Form.Get("redirect_url")
	}

	if redirectURL != "" {
		return redirectURL
	}

	return router.config.BasePath
}

func joinPath(elem ...string) string {
	var p string
	if !strings.HasPrefix(elem[0], "/") {
		elem[0] = "/" + elem[0]
		p = path.Join(elem...)[1:]
	} else {
		p = path.Join(elem...)
	}
	if strings.HasSuffix(elem[len(elem)-1], "/") && !strings.HasSuffix(p, "/") {
		p += "/"
	}
	return p
}
