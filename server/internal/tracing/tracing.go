package tracing

import (
	"context"
	"errors"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	tracesdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
	"go.opentelemetry.io/otel/trace/noop"
)

// Tracing wraps all the required Tracing components and provides a unified interface to access them and shut them down.
// All functions on the Tracing struct are designed to work with a nil pointer so should always be safe to use.
type Tracing struct {
	exporter   tracesdk.SpanExporter
	provider   *tracesdk.TracerProvider
	propagator propagation.TextMapPropagator
}

//nolint:gochecknoglobals
var noopTracerProvider = noop.NewTracerProvider()

// New creates a new tracing setup with the correct resource, trace providers, exporters and propagators.
// If not enabled, it will return nil.
func New(ctx context.Context, config Config) (*Tracing, error) {
	if !config.Enabled || config.Output.OTELGRPCExporter == nil {
		return nil, nil //nolint:nilnil
	}

	exporter, err := newExporter(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("error setting up exporter: %w", err)
	}

	r, err := resource.New( //nolint:varnamelen
		ctx,
		resource.WithSchemaURL(semconv.SchemaURL),
		resource.WithFromEnv(),
		resource.WithTelemetrySDK(),
		resource.WithProcess(),
		resource.WithOS(),
		resource.WithContainer(),
		resource.WithHost(),
		resource.WithAttributes(
			semconv.ServiceName(config.Info.Name),
			semconv.ServiceVersion(config.Info.Version),
			semconv.ServiceInstanceID(config.Info.ID),
			semconv.K8SNodeName(config.Info.Node),
			semconv.K8SNamespaceName(config.Info.Namespace),
			semconv.DeploymentEnvironment(config.Info.Env),
		),
	)

	if err != nil {
		return nil, fmt.Errorf("error constructing OTEL resource: %w", err)
	}

	var expoterOpt tracesdk.TracerProviderOption

	if config.Output.OTELGRPCExporter != nil {
		if config.Output.OTELGRPCExporter.Sync {
			expoterOpt = tracesdk.WithSyncer(exporter)
		} else {
			expoterOpt = tracesdk.WithBatcher(exporter)
		}
	}

	provider := tracesdk.NewTracerProvider(
		expoterOpt,
		tracesdk.WithResource(r),
	)

	return &Tracing{
		exporter:   exporter,
		provider:   provider,
		propagator: newPropagator(),
	}, nil
}

// NewGlobal is like [New], except it sets the provider and propagator as global.
func NewGlobal(ctx context.Context, config Config) (*Tracing, error) {
	t, err := New(ctx, config)
	if err != nil {
		return nil, err
	}

	if t == nil {
		return nil, nil //nolint:nilnil
	}

	otel.SetTracerProvider(t.provider)

	// Register the trace context and baggage propagators so data is propagated across services/processes.
	otel.SetTextMapPropagator(t.propagator)

	return t, nil
}

func newPropagator() propagation.TextMapPropagator {
	return propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)
}

func newExporter(ctx context.Context, config Config) (tracesdk.SpanExporter, error) {
	if !config.Enabled {
		return nil, nil //nolint:nilnil
	}

	if config.Output.OTELGRPCExporter == nil || config.Output.OTELGRPCExporter.Endpoint == "" {
		return nil, nil //nolint:nilnil
	}

	opts := []otlptracegrpc.Option{otlptracegrpc.WithEndpoint(config.Output.OTELGRPCExporter.Endpoint)}

	if config.Output.OTELGRPCExporter.AllowInsecure {
		opts = append(opts, otlptracegrpc.WithInsecure())
	}

	return otlptracegrpc.New(ctx, opts...)
}

// Returns a new named tracer. If [t] is a nil pointer, a no-op tracer will be returned instead.
func (t *Tracing) Tracer(name string, opts ...trace.TracerOption) trace.Tracer {
	if t == nil {
		return noopTracerProvider.Tracer(name)
	}

	return t.provider.Tracer(name, opts...)
}

func (t *Tracing) Provider() trace.TracerProvider {
	if t == nil {
		return noopTracerProvider
	}

	return t.provider
}

func (t *Tracing) Propagator() propagation.TextMapPropagator {
	if t == nil {
		return nil
	}

	return t.propagator
}

// Stop all the components of the tracing setup. This function is safe to call even if [t] is a nil pointer.
func (t *Tracing) Stop(ctx context.Context) error {
	if t == nil {
		return nil
	}

	var err error

	if t.provider != nil {
		err = errors.Join(t.provider.Shutdown(ctx))
		t.provider = nil
	}

	if t.exporter != nil {
		err = errors.Join(t.exporter.Shutdown(ctx))
		t.exporter = nil
	}

	return err
}
