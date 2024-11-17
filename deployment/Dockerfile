FROM --platform=$BUILDPLATFORM tonistiigi/xx AS xx

FROM --platform=$BUILDPLATFORM node:20-alpine3.18 as frontend

RUN apk update && apk upgrade && apk add --no-cache just curl

COPY . /belt

WORKDIR /belt

RUN just build-js build-js build-styles build-icons _fonts

FROM --platform=$BUILDPLATFORM golang:1.21.4-alpine3.18 as builder

COPY --from=xx / /

RUN apk update && apk upgrade && apk add --no-cache just clang lld

ARG TARGETPLATFORM
RUN xx-apk add musl-dev gcc

COPY . /belt
COPY --from=frontend /belt/ui/build /belt/ui/build

WORKDIR /belt

ARG VERSION
RUN xx-go --wrap
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg \
    CGO_ENABLED=1 GO_LDFLGAS="-linkmode=external -extldflags=-static -s -w" GO_BUILD_FLAGS="-trimpath" GO_TAGS="linux,sqlite_omit_load_extension,sqlite_foreign_keys,sqlite_fts5" \
	VERSION=$VERSION \
    just _build-go && \
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

ENV STUFF_DATABASE_PATH="/run/belt.db"
ENV STUFF_FILE_DIR="/run/files"

USER nobody

CMD ["/belt"]

