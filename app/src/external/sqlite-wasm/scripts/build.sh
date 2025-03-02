#!/usr/bin/env bash

set -eux
set -o pipefail

/scripts/install-deps.sh;

/scripts/install-emscripten.sh;

/scripts/build-openssl.sh;

/scripts/build-sqlite.sh
