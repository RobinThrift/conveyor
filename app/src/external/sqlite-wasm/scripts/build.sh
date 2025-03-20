#!/usr/bin/env bash

set -eux
set -o pipefail

if [ ! -d "/.cache" ]; then
    mkdir "/.cache";
fi;

/scripts/install-deps.sh;

/scripts/install-emscripten.sh;

/scripts/build-openssl.sh;

/scripts/build-sqlite.sh
