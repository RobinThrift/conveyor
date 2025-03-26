package tracing

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRequestFromContext(t *testing.T) {
	t.Parallel()

	ctx := t.Context()

	ctx = RequestIDWithCtx(ctx, "test")

	fromCtx, ok := RequestIDFromCtx(ctx)
	assert.True(t, ok)
	assert.Equal(t, "test", fromCtx)

	fromCtx, ok = RequestIDFromCtx(t.Context())
	assert.False(t, ok)
	assert.Empty(t, fromCtx)
}

func TestHTTPHeader(t *testing.T) {
	t.Parallel()

	req, err := http.NewRequest(http.MethodGet, "http://example.com", nil)
	require.NoError(t, err)

	fromHeader, ok := RequestIDFromHeader(req.Header)
	assert.False(t, ok)
	assert.Empty(t, fromHeader)

	SetRequestIDHeader(req.Header, "test")

	fromHeader, ok = RequestIDFromHeader(req.Header)
	assert.True(t, ok)
	assert.Equal(t, "test", fromHeader)
}
