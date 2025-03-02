#!/bin/bash

/emsdk/emsdk activate latest;

source /emsdk/emsdk_env.sh

git clone https://github.com/sqlcipher/sqlcipher.git /sqlite;

cd /sqlite;

git checkout "$SQLCIPHER_VERSION"

OPENSSL_DIR="/openssl-src"

./configure \
    --enable-tempstore=yes \
    CFLAGS="-DSQLITE_HAS_CODEC" \
    CPPFLAGS="-I$OPENSSL_DIR/include" \
    LDFLAGS="$OPENSSL_DIR/libcrypto.a" \
    --enable-fts5

make sqlite3.c

cd ext/wasm;

git apply /patches/GNUmakefile.patch;

make release;

OUTDIR="/out"
if [ -d "$OUTDIR" ]; then
  rm -rf "$OUTDIR"
fi
mkdir -p "$OUTDIR"

cp -r /sqlite/ext/wasm/jswasm/{sqlite3-bundler-friendly.mjs,sqlite3.wasm,sqlite3-opfs-async-proxy.js,sqlite3-node.mjs} "$OUTDIR"
