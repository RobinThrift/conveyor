#!/bin/bash

set -eux
set -o pipefail

/emsdk/emsdk activate latest;

source /emsdk/emsdk_env.sh


OPENSSL_DIR="/openssl-src"
OPENSSL_CACHE_DIR="/.cache/openssl/${OPENSSL_VERSION}"

if [ -d "${OPENSSL_CACHE_DIR}" ]; then
    cp -r "${OPENSSL_CACHE_DIR}" "${OPENSSL_DIR}";
else
    curl -L -O "https://www.openssl.org/source/openssl-$OPENSSL_VERSION.tar.gz"
    mkdir -p ${OPENSSL_DIR}
    tar xf "openssl-$OPENSSL_VERSION.tar.gz" --strip-components=1 --directory=${OPENSSL_DIR}
fi

cd ${OPENSSL_DIR} || exit 1

LDFLAGS="\
  -s ENVIRONMENT='web'\
  -s FILESYSTEM=1\
  -s MODULARIZE=1\
  -s EXPORTED_RUNTIME_METHODS=\"['callMain', 'FS', 'TTY']\"\
  -s INVOKE_RUN=0\
  -s EXIT_RUNTIME=1\
  -s EXPORT_ES6=0\
  -s EXPORT_NAME='EmscrJSR_openssl'\
  -s ALLOW_MEMORY_GROWTH=1"

export LDFLAGS
export CC=emcc
export CXX=emcc

emconfigure ./Configure \
  no-hw \
  no-shared \
  no-asm \
  no-threads \
  no-ssl3 \
  no-dtls \
  no-engine \
  no-dso \
  linux-x32 \
  -static\

sed -i 's/$(CROSS_COMPILE)//' Makefile
emmake make -j 16 build_generated libssl.a libcrypto.a apps/openssl

rm -rf "${OPENSSL_CACHE_DIR}"
mkdir -p $(dirname "${OPENSSL_CACHE_DIR}")
cp -r "${OPENSSL_DIR}" "${OPENSSL_CACHE_DIR}"
