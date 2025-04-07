package httpmiddleware

import (
	"net/http"

	"go.robinthrift.com/conveyor/internal/version"
)

//nolint:gochecknoglobals
var buildInfo = version.GetBuildInfo()

func Cache(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		etag := r.Header.Get("If-None-Match")
		if etag == buildInfo.Hash {
			w.WriteHeader(http.StatusNotModified)

			return
		}

		w.Header().Add("Last-Modified", buildInfo.Date.UTC().Format("Mon, 02 Jan 2006 15:04:05 GMT"))
		w.Header().Add("ETag", buildInfo.Hash)
		w.Header().Add("Cache-Control", "max-age=2592000") // 30 days max age

		next.ServeHTTP(w, r)
	})
}
