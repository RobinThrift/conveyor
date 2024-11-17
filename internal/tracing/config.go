package tracing

type Config struct {
	Enabled bool   `env:"ENABLED"`
	Info    Info   `envPrefix:"INFO_"`
	Output  Output `envPrefix:"OUTPUT_"`
}

type Info struct {
	ID      string `env:"ID"`
	Name    string `env:"NAME"`
	Version string `env:"VERSION"`

	Namespace string `env:"NAMESPACE"`
	Node      string `env:"NODE"`

	Env string `env:"ENV"`
}

type Output struct {
	OTELGRPCExporter *OTELExporterConfig `env:"OTEL_GRPC_EXPORTER"`
}

type OTELExporterConfig struct {
	Endpoint      string `env:"ENDPOINT"`
	AllowInsecure bool   `env:"ALLOWINSECURE"`
	Sync          bool   `env:"SYNC"`
}
