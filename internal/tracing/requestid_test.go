package tracing

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRequestFromContext(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	ctx = RequestIDWithCtx(ctx, "test")

	fromCtx, ok := RequestIDFromCtx(ctx)
	assert.True(t, ok)
	assert.Equal(t, "test", fromCtx)

	fromCtx, ok = RequestIDFromCtx(context.Background())
	assert.False(t, ok)
	assert.Empty(t, fromCtx)
}

func TestHTTPHeader(t *testing.T) {
	t.Parallel()

	req, err := http.NewRequest(http.MethodGet, "http://example.com", nil)
	assert.NoError(t, err)

	fromHeader, ok := RequestIDFromHeader(req.Header)
	assert.False(t, ok)
	assert.Empty(t, fromHeader)

	SetRequestIDHeader(req.Header, "test")

	fromHeader, ok = RequestIDFromHeader(req.Header)
	assert.True(t, ok)
	assert.Equal(t, "test", fromHeader)
}
