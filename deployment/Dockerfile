FROM --platform=$BUILDPLATFORM debian:12-slim AS sqlite3-builder

COPY ./app/src/external/sqlite-wasm/scripts/install-deps.sh /scripts/install-deps.sh

RUN /scripts/install-deps.sh;

COPY ./app/src/external/sqlite-wasm/scripts /scripts
COPY ./app/src/external/sqlite-wasm/patches /patches
COPY ./app/src/external/sqlite-wasm /sqlite-wasm

WORKDIR /sqlite-wasm

RUN --mount=type=cache,target=/.cache \
    /sqlite-wasm/build-in-docker.sh


FROM --platform=$BUILDPLATFORM node:23-alpine3.21 AS frontend

RUN apk update && apk upgrade && apk add --no-cache curl git && \
    curl -sSf https://just.systems/install.sh | sh -s -- --to /usr/local/bin && \
    just --version

COPY ./app/package.json /conveyor/app/package.json
COPY ./app/package-lock.json /conveyor/app/package-lock.json
COPY ./app/justfile /conveyor/app/justfile

WORKDIR /conveyor/app

RUN just install

COPY ./app /conveyor/app
COPY .git /conveyor/.git
COPY --from=sqlite3-builder /out /conveyor/app/src/external/sqlite-wasm/build

RUN just build

FROM --platform=$BUILDPLATFORM golang:1.24.1-alpine3.21 AS builder

RUN apk update && apk upgrade && apk add --no-cache curl git &&  \
    curl -sSf https://just.systems/install.sh | sh -s -- --to /usr/local/bin && \
    just --version

COPY ./server /conveyor
COPY --from=frontend /conveyor/app/build /conveyor/internal/ingress/app/assets
WORKDIR /conveyor

ARG VERSION TARGETOS TARGETARCH
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg \
    GOOS=$TARGETOS GOARCH=$TARGETARCH CGO_ENABLED=0 \
    GO_LDFLAGS="-s -w" GO_BUILD_FLAGS="-trimpath" VERSION=$VERSION \
    just build

# Create a nonroot user to copy
RUN echo "nobody:*:65534:65534:nobody:/_nonexistent:/bin/false" > /etc/passwd.nonroot

RUN mkdir -p /run/conveyor/files /tmp/conveyor

FROM scratch

LABEL org.opencontainers.image.source=https://github.com/RobinThrift/conveyor
LABEL org.opencontainers.image.licenses=BSD-3-Clause

COPY --from=builder /conveyor/build/conveyor /conveyor
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd.nonroot /etc/passwd
COPY --from=builder --chown=nobody:nobody /run/conveyor /run
COPY --from=builder --chown=nobody:nobody /tmp/conveyor /tmp

ENV conveyor_DATABASE_PATH="/run/conveyor.db"
ENV conveyor_BLOBS_DIR="/run/blobs"

USER nobody

CMD ["/conveyor"]

