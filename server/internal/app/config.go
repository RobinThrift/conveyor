//nolint:mnd // config values
package app

import (
	"errors"
	"io/fs"
	"os"
	"time"

	"github.com/caarlos0/env/v11"
	"github.com/subosito/gotenv"
	"go.robinthrift.com/conveyor/internal/tracing"
	"go.robinthrift.com/conveyor/internal/version"
)

type Config struct {
	Addr     string `env:"ADDR"`
	BasePath string `env:"BASE_URL"`

	Blobs Blobs `envPrefix:"BLOBS_"`

	Database Database `envPrefix:"DATABASE_"`

	Argon2 Argon2 `envPrefix:"ARGON2_"`

	AccessTokenValidDuration  time.Duration `env:"ACCESS_TOKEN_VALID_DURATION"`
	RefreshTokenValidDuration time.Duration `env:"REFRESH_TOKEN_VALID_DURATION"`

	Log Log `envPrefix:"LOG_"`

	Tracing tracing.Config `envPrefix:"TRACING_"`

	Init Init `envPrefix:"INIT_"`
}

type Blobs struct {
	Dir string `env:"DIR"`
}

type Log struct {
	Format string `env:"FORMAT"`
	Level  string `env:"LEVEL"`
}

type Database struct {
	Path         string        `env:"PATH"`
	EnableWAL    bool          `env:"ENABLE_WAL"`
	Timeout      time.Duration `env:"TIMEOUT"`
	DebugEnabled bool          `env:"DEBUG_ENABLED"`
}

type Argon2 struct {
	KeyLen  uint32 `env:"KEY_LEN"`
	Memory  uint32 `env:"MEMORY"`
	Threads uint8  `env:"THREADS"`
	Time    uint32 `env:"TIME"`
	Version int
}

type Init struct {
	Username string `env:"USERNAME"`
	Password string `env:"PASSWORD"`
}

//nolint:gochecknoglobals
var defaultConfig = Config{
	Addr:     ":8080",
	BasePath: "/",
	Blobs: Blobs{
		Dir: "blobs",
	},
	Database: Database{
		Path:      "conveyor.db",
		EnableWAL: true,
		Timeout:   time.Second * 10,
	},
	Argon2: Argon2{
		KeyLen:  32,
		Memory:  32768, // 1GiB
		Threads: 2,
		Time:    1,
	},

	AccessTokenValidDuration:  time.Hour * 24,
	RefreshTokenValidDuration: time.Hour * 24 * 30,

	Log: Log{
		Format: "json",
		Level:  "info",
	},
	Tracing: tracing.Config{
		Enabled: false,
		Info: tracing.Info{
			ID:        getEnvDefault("SERVICE_ID", getEnvDefault("POD_NAME", getEnvDefault("HOSTNAME", ""))),
			Name:      getEnvDefault("SERVICE_NAME", "conveyor"),
			Version:   version.Version,
			Namespace: getEnvDefault("POD_NAMESPACE", ""),
			Node:      getEnvDefault("NODE_NAME", ""),
			Env:       getEnvDefault("ENV", "production"),
		},
	},
}

func ParseConfig(prefix string) (Config, error) {
	err := gotenv.Load()
	if err != nil {
		var pe = &fs.PathError{}
		if !errors.As(err, &pe) {
			return defaultConfig, err
		}
	}

	config := defaultConfig

	err = env.ParseWithOptions(&config, env.Options{
		Prefix: prefix,
	})
	if err != nil {
		return defaultConfig, err
	}

	return config, nil
}

func getEnvDefault(name string, d string) string {
	s, ok := os.LookupEnv(name)
	if !ok {
		return d
	}

	return s
}
