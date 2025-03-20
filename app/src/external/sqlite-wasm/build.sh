#!/usr/bin/env bash

set -eux
set -o pipefail

OPENSSL_VERSION=$(cat `pwd`/openssl_version)
SQLCIPHER_VERSION=$(cat `pwd`/sqlcipher_version)

mkdir -p `pwd`/build

docker run --rm \
    -v `pwd`/scripts:/scripts \
    -v `pwd`/patches:/patches \
    -v `pwd`/build:/out \
    -e OPENSSL_VERSION="$OPENSSL_VERSION" \
    -e SQLCIPHER_VERSION="$SQLCIPHER_VERSION" \
    debian:12-slim \
    /scripts/build.sh;

cp patches/index.mjs build/index.mjs;
