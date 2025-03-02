#!/bin/bash

/emsdk/emsdk activate latest;

source /emsdk/emsdk_env.sh


OPENSSL_DIR="/openssl-src"

if [ -d ${OPENSSL_DIR} ]; then
  rm -rf ${OPENSSL_DIR}
fi

if [ ! -f "openssl-$OPENSSL_VERSION.tar.gz" ]; then
  curl -L -O "https://www.openssl.org/source/openssl-$OPENSSL_VERSION.tar.gz"
fi

mkdir -p ${OPENSSL_DIR}
tar xf "openssl-$OPENSSL_VERSION.tar.gz" --strip-components=1 --directory=${OPENSSL_DIR}
cd ${OPENSSL_DIR} || exit 1

cp /out/openssl.cnf openssl.cnf

LDFLAGS="\
  -s ENVIRONMENT='web'\
  -s FILESYSTEM=1\
  -s MODULARIZE=1\
  -s EXPORTED_RUNTIME_METHODS=\"['callMain', 'FS', 'TTY']\"\
  -s INVOKE_RUN=0\
  -s EXIT_RUNTIME=1\
  -s EXPORT_ES6=0\
  -s EXPORT_NAME='EmscrJSR_openssl'\
  -s USE_ES6_IMPORT_META=0\
  -s ALLOW_MEMORY_GROWTH=1"
  # --embed-file ./openssl.cnf"

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
