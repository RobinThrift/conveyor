#!/usr/bin/env bash

set -eux
set -o pipefail

EMSDK_CACHE_DIR="/.cache/emsdk"

if [ -d "${EMSDK_CACHE_DIR}" ]; then
    cp -r "${EMSDK_CACHE_DIR}" /emsdk;
    cd /emsdk;
    git pull;
else
    git clone https://github.com/emscripten-core/emsdk.git /emsdk;
fi

cd /emsdk;

./emsdk install latest;

./emsdk activate latest;

source ./emsdk_env.sh

rm -rf "${EMSDK_CACHE_DIR}"
cp -r /emsdk "${EMSDK_CACHE_DIR}"
