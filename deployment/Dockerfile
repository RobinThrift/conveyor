FROM --platform=$BUILDPLATFORM tonistiigi/xx:1.4.0 AS xx

FROM --platform=$BUILDPLATFORM node:23-alpine3.19 AS frontend

RUN apk update && apk upgrade && apk add --no-cache curl && \
    curl -sSf https://just.systems/install.sh | sh -s -- --to /usr/local/bin && \
    just --version

COPY ./ui/package.json /belt/ui/package.json
COPY ./ui/package-lock.json /belt/ui/package-lock.json
COPY ./ui/justfile /belt/ui/justfile

WORKDIR /belt/ui

RUN just install

COPY ./ui /belt/ui

RUN just build

FROM --platform=$BUILDPLATFORM golang:1.23.3-alpine3.19 AS builder

COPY --from=xx / /

RUN apk update && apk upgrade && apk add --no-cache curl gcc musl-dev &&  \
    curl -sSf https://just.systems/install.sh | sh -s -- --to /usr/local/bin && \
    just --version


ARG TARGETPLATFORM
RUN xx-apk add musl-dev gcc

COPY . /belt
COPY --from=frontend /belt/ui/build /belt/ui/build

WORKDIR /belt

ARG VERSION
RUN xx-go --wrap
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg \
    CGO_ENABLED=1 \
    GO_LDFLAGS="-linkmode=external -extldflags=-static -s -w" \
    GO_TAGS="linux,sqlite_omit_load_extension,sqlite_foreign_keys,sqlite_fts5" \
    VERSION=$VERSION \
    just build && \
    xx-verify --static /belt/build/belt

# Create a nonroot user to copy
RUN echo "nobody:*:65534:65534:nobody:/_nonexistent:/bin/false" > /etc/passwd.nonroot

RUN mkdir -p /run/belt/files /tmp/belt

FROM scratch

LABEL org.opencontainers.image.source=https://github.com/RobinThrift/belt
LABEL org.opencontainers.image.licenses=BSD-3-Clause

COPY --from=builder /belt/build/belt /belt
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd.nonroot /etc/passwd
COPY --from=builder --chown=nobody:nobody /run/belt /run
COPY --from=builder --chown=nobody:nobody /tmp/belt /tmp

ENV BELT_DATABASE_PATH="/run/belt.db"
ENV BELT_ATTACHMENTS_DIR="/run/files"

USER nobody

CMD ["/belt"]

