#!/usr/bin/env bash

set -eux
set -o pipefail

export OPENSSL_VERSION=$(cat ./openssl_version)
export SQLCIPHER_VERSION=$(cat ./sqlcipher_version)

/scripts/install-emscripten.sh;

/scripts/build-openssl.sh;

/scripts/build-sqlite.sh

cp /patches/index.mjs /out/index.mjs;
