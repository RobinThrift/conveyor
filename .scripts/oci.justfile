oci_repo       := env_var_or_default("OCI_REPO", "ghcr.io/robinthrift/belt")
oci_platforms  := env_var_or_default("OCI_PLATFORMS", "linux/amd64,linux/arm64")

docker_cmd := env_var_or_default("DOCKER_CMD", "buildx build")
docker_extra_args := env_var_or_default("DOCKER_EXTRA_ARGS", "")

build-oci-image:
    docker {{ docker_cmd }} \
        --build-arg="VERSION={{ version }}" \
        --platform="{{ oci_platforms }}" \
        {{ docker_extra_args }} \
        -f ./deployment/Dockerfile \
        -t {{ oci_repo }}:{{ version }} .

run-oci-image:
    -docker rmi {{ oci_repo }}:{{ version }}

    docker build \
        --build-arg="VERSION={{ version }}" \
        -f ./deployment/Dockerfile \
        -t {{ oci_repo }}:{{ version }} .

    docker run --rm \
        -e BELT_LOG_LEVEL="debug" -e BELT_LOG_FORMAT="console" \
        -e BELT_ADDR=":8081" \
        -e BELT_SECURE_COOKIES="false" \
        -e BELT_DATABASE_DEBUG_ENABLED="true" \
        -e BELT_INIT_USERNAME="user" \
        -e BELT_INIT_PASSWORD="password" \
        -p 8081:8081 \
        {{ oci_repo }}:{{ version }}
