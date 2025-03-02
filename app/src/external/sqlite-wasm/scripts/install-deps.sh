#!/usr/bin/env bash

set -eux
set -o pipefail

apt update;

apt install -y \
    tcl \
    libssl-dev \
    curl \
    xz-utils \
    git \
    python3 \
    cmake \
    wabt;
