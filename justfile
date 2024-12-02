local_bin  := absolute_path("./.bin")
version    := env_var_or_default("VERSION", "dev")

go_ldflags := env_var_or_default("GO_LDFLAGS", "") + " -X 'github.com/RobinThrift/belt/internal.Version=" + version + "'"
go_tags := env_var_or_default("GO_TAGS", "sqlite_omit_load_extension,sqlite_foreign_keys,sqlite_fts5")
go_buildflags := env_var_or_default("GO_BUILD_FLAGS", "-trimpath") + " -tags " + go_tags
go_test_reporter := env("GO_TEST_REPORTER", "pkgname-and-test-fails")

import ".scripts/database.justfile"
import ".scripts/api.justfile"
import ".scripts/oci.justfile"

_default:
    @just --list

# run the binary locally and restart on file changes
run: (_install-tool "watchexec")
    @mkdir -p test/manual
    @BELT_LOG_LEVEL="debug" BELT_LOG_FORMAT="console" \
        BELT_ADDR="localhost:8081" \
        BELT_SECURE_COOKIES="false" \
        BELT_DATABASE_PATH="./test/manual/belt.db" \
        BELT_DATABASE_DEBUG_ENABLED="true" \
        BELT_ATTACHMENTS_DIR="./test/manual/attachments" \
        BELT_INIT_USERNAME="user" \
        BELT_INIT_PASSWORD="password" \
        {{ local_bin }}/watchexec -r -e go -- go run -trimpath -tags {{ go_tags }},dev ./bin/belt

run-prod:
    cd ui && just install build
    just build
    @BELT_LOG_LEVEL="debug" BELT_LOG_FORMAT="console" \
        BELT_ADDR="localhost:8081" \
        BELT_SECURE_COOKIES="false" \
        BELT_DATABASE_PATH="./test/manual/belt.db" \
        BELT_DATABASE_DEBUG_ENABLED="true" \
        BELT_ATTACHMENTS_DIR="./test/manual/attachments" \
        BELT_INIT_USERNAME="user" \
        BELT_INIT_PASSWORD="password" \
        ./build/belt

build:
    go build -ldflags="{{go_ldflags}}" {{ go_buildflags }} -o build/belt ./bin/belt

test *flags="-v -failfast -timeout 15m ./...": (_install-tool "gotestsum")
    {{ local_bin }}/gotestsum --format {{ go_test_reporter }} --format-hide-empty-pkg -- {{ go_buildflags }} {{ flags }}

test-watch *flags="-v -failfast -timeout 15m ./...": (_install-tool "gotestsum")
    {{ local_bin }}/gotestsum --format {{ go_test_reporter }} --format-hide-empty-pkg --watch -- {{ go_buildflags }} {{ flags }}

test-report *flags="-v -failfast -timeout 15m ./...": (_install-tool "gotestsum")
    {{ local_bin }}/gotestsum --junitfile "tests.junit.xml" --junitfile-hide-empty-pkg --junitfile-project-name "RobinThrift/belt" --format {{ go_test_reporter }} --format-hide-empty-pkg -- {{ go_buildflags }} {{ flags }}

# lint using staticcheck and golangci-lint
lint: (_install-tool "staticcheck") (_install-tool "golangci-lint") (_install-tool "sqlc") (_install-tool "vacuum")
    {{ local_bin }}/staticcheck ./...
    {{ local_bin }}/golangci-lint run ./...
    {{ local_bin }}/sqlc -f internal/storage/database/sqlite/sqlc.yaml vet
    {{ local_bin }}/vacuum lint --ruleset .scripts/vacuum.yaml --details --fail-severity warn --no-banner --all-results ./api/apiv1/apiv1.openapi3.yaml

lint-report: (_install-tool "staticcheck") (_install-tool "golangci-lint")
    {{ local_bin }}/golangci-lint run --timeout 5m --out-format=junit-xml ./... > lint.junit.xml
    {{ local_bin }}/vacuum report --ruleset .scripts/vacuum.yaml --no-style --junit ./api/apiv1/apiv1.openapi3.yaml -o > apiv1.junit.xml

fmt:
    @go fmt ./...

generate: _gen-sqlc _gen-api-v1-server


clean:
    rm -rf {{ local_bin }} build ui/build ui/node_modules test/manual
    go clean -cache

# generate a release with the given tag
release tag:
    just changelog {{tag}}
    git add CHANGELOG
    git commit -m "Releasing version {{tag}}"
    git tag {{tag}}
    git push
    git push origin {{tag}}

# generate a changelog using https://github.com/orhun/git-cliff
changelog tag: (_install-tool "git-cliff")
    git-cliff --config CHANGELOG/cliff.toml -o CHANGELOG/CHANGELOG-{{tag}}.md --unreleased --tag {{ tag }} 
    echo "- [CHANGELOG-{{tag}}.md](./CHANGELOG-{{tag}}.md)" >> CHANGELOG/README.md


_install-tool tool:
    @cd ./.scripts/toolfetcher && go run . -to {{ local_bin }} -versionfile ../TOOL_VERSIONS {{ tool }}
