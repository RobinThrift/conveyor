package httpmiddleware

import (
	"net/http"
	"strings"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func TraceRequest(opts ...otelhttp.Option) func(next http.Handler) http.Handler {
	formatter := func(_ string, req *http.Request) string {
		return strings.TrimSuffix(req.URL.Path, "/")
	}

	opts = append(
		opts,
		otelhttp.WithSpanNameFormatter(formatter),
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
	)

	return func(next http.Handler) http.Handler {
		return otelhttp.NewHandler(next, "/", opts...)
	}
}
