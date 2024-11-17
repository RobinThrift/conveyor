package tracing

import (
	"context"
	"net/http"

	"github.com/segmentio/ksuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

type ctxReqIDKeyType string

const ctxReqIDKey = ctxReqIDKeyType("ctxReqIDKey")

func NewRequestID() string {
	return ksuid.New().String()
}

func RequestIDWithCtx(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxReqIDKey, id)
}

func RequestIDFromCtx(ctx context.Context) (string, bool) {
	val := ctx.Value(ctxReqIDKey)
	id, ok := val.(string)
	if ok {
		return id, true
	}

	return "", false
}

const requestIDHeader = "x-request-id"

func RequestIDFromHeader(header http.Header) (string, bool) {
	reqID := header.Get(requestIDHeader)
	if reqID == "" {
		return "", false
	}

	return reqID, true
}

func SetRequestIDHeader(header http.Header, reqID string) {
	existing := header.Get(requestIDHeader)
	if existing != "" {
		return
	}

	header.Set(requestIDHeader, reqID)
}

func AddRequestIDToSpan(ctx context.Context) {
	span := trace.SpanFromContext(ctx)
	if span == nil || !span.IsRecording() {
		return
	}

	reqID, ok := RequestIDFromCtx(ctx)
	if !ok {
		return
	}

	span.SetAttributes(attribute.String("spacefleet.request.id", reqID))
}
