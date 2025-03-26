package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"

	"github.com/RobinThrift/toolfetcher"
	"github.com/RobinThrift/toolfetcher/recipes"
)

func main() {
	if err := run(context.Background(), os.Args[1:]); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context, args []string) error {
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	flags := flag.NewFlagSet("memos-importer", flag.ExitOnError)

	binDir := flags.String("to", "", "bin dir")
	versionfile := flags.String("versionfile", "", "path to version file")

	err := flags.Parse(args)
	if err != nil {
		return fmt.Errorf("invalid usage: %v", err)
	}

	fetcher := toolfetcher.ToolFetcher{
		VersionFile: *versionfile,
		BinDir:      *binDir,
		Recipes: []recipes.Recipe{
			{
				Name: "staticcheck",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "honnef.co/go/tools/cmd/staticcheck",
				},
				Test: []string{"--version"},
			},

			{
				Name: "golangci-lint",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "github.com/golangci/golangci-lint/v2/cmd/golangci-lint",
				},
				Test: []string{"--version"},
			},

			{
				Name: "gotestsum",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "gotest.tools/gotestsum",
				},
				Test: []string{"--version"},
			},

			{
				Name: "oapi-codegen",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen",
				},
				Test: []string{"--version"},
			},

			{
				Name: "watchexec",
				Src: recipes.Source{
					Type:        recipes.SourceTypeBinDownload,
					URLTemplate: "https://github.com/watchexec/watchexec/releases/download/v{{ .Version }}/watchexec-{{ .Version }}-{{ .Arch }}-{{ .OS }}.tar.xz",
				},
				Test: []string{"--version"},
				OS:   map[string]string{"darwin": "apple-darwin", "linux": "unknown-linux-gnu"},
				Arch: map[string]string{"arm64": "aarch64", "amd64": "x86_64"},
			},

			{
				Name: "goose",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "github.com/pressly/goose/v3/cmd/goose",
				},
				Test: []string{"--version"},
			},

			{
				Name: "sqlc",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "github.com/sqlc-dev/sqlc/cmd/sqlc",
				},
				Test: []string{"version"},
			},

			{
				Name: "git-cliff",
				Src: recipes.Source{
					Type:        recipes.SourceTypeBinDownload,
					URLTemplate: "https://github.com/orhun/git-cliff/releases/download/v{{ .Version }}/git-cliff-{{ .Version }}-{{ .Arch }}-{{ .OS }}.tar.gz",
				},
				OS:   map[string]string{"darwin": "apple-darwin", "linux": "unknown-linux-gnu"},
				Arch: map[string]string{"arm64": "aarch64", "amd64": "x86_64"},
				Test: []string{"--version"},
			},

			{
				Name: "vacuum",
				Src: recipes.Source{
					Type:        recipes.SourceTypeGoInstall,
					URLTemplate: "github.com/daveshanley/vacuum",
				},
				Test: []string{"version"},
			},
		},
	}

	return fetcher.Fetch(ctx, flags.Arg(0))
}
