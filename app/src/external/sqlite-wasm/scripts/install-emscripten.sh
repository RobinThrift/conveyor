#!/usr/bin/env bash

set -eux
set -o pipefail

git clone https://github.com/emscripten-core/emsdk.git /emsdk;

cd /emsdk;

./emsdk install latest;

./emsdk activate latest;

source ./emsdk_env.sh
