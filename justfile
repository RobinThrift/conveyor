local_bin         := absolute_path("./.bin")
version           := env_var_or_default("VERSION", "dev")
oci_repo          := env_var_or_default("OCI_REPO", "ghcr.io/robinthrift/belt")
oci_platforms     := env_var_or_default("OCI_PLATFORMS", "linux/amd64,linux/arm64")
docker_cmd        := env_var_or_default("DOCKER_CMD", "buildx build")
docker_extra_args := env_var_or_default("DOCKER_EXTRA_ARGS", "")

_default:
    @just --list

build-oci-image:
    docker {{ docker_cmd }} \
        --build-arg="VERSION={{ version }}" \
        --platform="{{ oci_platforms }}" \
        {{ docker_extra_args }} \
        -f ./deployment/Dockerfile \
        -t {{ oci_repo }}:{{ replace_regex(version, "^v", "") }} .

run-oci-image:
    -docker rmi {{ oci_repo }}:{{ replace_regex(version, "^v", "") }}

    docker build \
        --build-arg="VERSION={{ version }}" \
        -f ./deployment/Dockerfile \
        -t {{ oci_repo }}:{{ replace_regex(version, "^v", "") }} .

    docker run --rm \
        -e BELT_LOG_LEVEL="debug" -e BELT_LOG_FORMAT="console" \
        -e BELT_ADDR=":8081" \
        -e BELT_SECURE_COOKIES="false" \
        -e BELT_DATABASE_DEBUG_ENABLED="true" \
        -e BELT_INIT_USERNAME="user" \
        -e BELT_INIT_PASSWORD="password" \
        -p 8081:8081 \
        {{ oci_repo }}:{{ replace_regex(version, "^v", "") }}

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
