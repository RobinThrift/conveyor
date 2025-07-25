#!/usr/bin/env bash

set -eu

set -o pipefail

download() {
  url="$1"
  output="$2"

    curl --proto =https --tlsv1.2 -sSfL "$url" -o"$output"
}

force=false
while test $# -gt 0; do
  case $1 in
    --tag)
      tag=$2
      shift
      ;;
    --dest)
      dest=$2
      shift
      ;;
    *)
      echo "error: unrecognized argument '$1'"
      exit 1
      ;;
  esac
  shift
done

if [ -z "${dest-}" ]; then
  echo "error: missing argument --dest"
  exit 1
fi

if [ -z "${tag-}" ]; then
  tag=$(
    download https://api.github.com/repos/casey/just/releases/latest - |
    grep tag_name |
    cut -d'"' -f4
  )
fi

if [ -z "${target-}" ]; then
  kernel=$(uname -s | cut -d- -f1)
  uname_target="$(uname -m)-$kernel"

  case $uname_target in
    aarch64-Linux) target=aarch64-unknown-linux-musl;;
    arm64-Darwin) target=aarch64-apple-darwin;;
    armv6l-Linux) target=arm-unknown-linux-musleabihf;;
    armv7l-Linux) target=armv7-unknown-linux-musleabihf;;
    x86_64-Darwin) target=x86_64-apple-darwin;;
    x86_64-Linux) target=x86_64-unknown-linux-musl;;
    *)
      echo "Unknown target ${uname_target}"
      exit 1
    ;;
  esac
fi

archive="https://github.com/casey/just/releases/download/$tag/just-$tag-$target.tar.gz"

td=$(mktemp -d || mktemp -d -t tmp)

download "$archive" - | tar -C "$td" -xz

mkdir -p "$dest"
cp "$td/just" "$dest/just"
chmod 755 "$dest/just"

rm -rf "$td"
