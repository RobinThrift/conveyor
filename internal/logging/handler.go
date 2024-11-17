package logging

import (
	"context"
	"log/slog"
	"time"

	"github.com/RobinThrift/belt/internal/tracing"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

type ctxHandler struct {
	handler        slog.Handler
	emitLogInTrace bool
}

func (h *ctxHandler) Enabled(ctx context.Context, l slog.Level) bool {
	return h.handler.Enabled(ctx, l)
}

func (h *ctxHandler) Handle(ctx context.Context, record slog.Record) error {
	if reqID, ok := tracing.RequestIDFromCtx(ctx); ok {
		record.AddAttrs(slog.String(RequestIDAttr, reqID))
	}

	addTraceID(ctx, &record, h.emitLogInTrace)

	return h.handler.Handle(ctx, record)
}

func (h *ctxHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &ctxHandler{
		handler:        h.handler.WithAttrs(attrs),
		emitLogInTrace: h.emitLogInTrace,
	}
}

func (h *ctxHandler) WithGroup(name string) slog.Handler {
	return &ctxHandler{
		handler:        h.handler.WithGroup(name),
		emitLogInTrace: h.emitLogInTrace,
	}
}

func addTraceID(ctx context.Context, record *slog.Record, emitLogInTrace bool) {
	span := trace.SpanFromContext(ctx)

	if span == nil || !span.IsRecording() {
		return
	}

	if emitLogInTrace {
		// Adding log info to span event.
		eventAttrs := make([]attribute.KeyValue, 0, record.NumAttrs())
		eventAttrs = append(eventAttrs,
			attribute.String(slog.MessageKey, record.Message),
			attribute.String(slog.LevelKey, record.Level.String()),
			attribute.String(slog.TimeKey, record.Time.Format(time.RFC3339Nano)),
		)

		record.Attrs(func(attr slog.Attr) bool {
			// @TODO: Add correct conversion from log attrs to span attrs
			eventAttrs = append(eventAttrs, attribute.String(attr.Key, attr.Value.String()))
			return true
		})

		span.AddEvent("log", trace.WithAttributes(eventAttrs...))
	}

	spanContext := span.SpanContext()
	if spanContext.HasTraceID() {
		traceID := spanContext.TraceID().String()
		record.AddAttrs(slog.String(TraceIDAttr, traceID))
	}

	if spanContext.HasSpanID() {
		spanID := spanContext.SpanID().String()
		record.AddAttrs(slog.String(SpanIDAttr, spanID))
	}
}
