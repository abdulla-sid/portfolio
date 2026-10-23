#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BUILD=20260716                 # pinned Protomaps daily build (YYYYMMDD)
PMTILES_VERSION=1.31.1         # pinned go-pmtiles CLI release

CITIES=(
  "lahore=74.15,31.35,74.55,31.65"
  "islamabad=72.90,33.52,73.25,33.78"
)

case "$(uname -sm)" in
  "Darwin arm64") ASSET=Darwin_arm64.zip ;;
  "Darwin x86_64") ASSET=Darwin_x86_64.zip ;;
  "Linux x86_64") ASSET=Linux_x86_64.tar.gz ;;
  "Linux aarch64") ASSET=Linux_arm64.tar.gz ;;
  *) echo "no go-pmtiles build for $(uname -sm)" >&2; exit 1 ;;
esac

BIN=scripts/.bin/pmtiles
if [ ! -x "$BIN" ]; then
  mkdir -p scripts/.bin
  URL="https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VERSION}/go-pmtiles_${PMTILES_VERSION}_${ASSET}"
  curl -fL "$URL" -o "scripts/.bin/$ASSET"
  case "$ASSET" in
    *.zip) unzip -o -q "scripts/.bin/$ASSET" pmtiles -d scripts/.bin ;;
    *) tar -xzf "scripts/.bin/$ASSET" -C scripts/.bin pmtiles ;;
  esac
  rm "scripts/.bin/$ASSET"
fi

mkdir -p public/map
for entry in "${CITIES[@]}"; do
  name="${entry%%=*}"
  bbox="${entry#*=}"
  out="public/map/${name}.pmtiles"
  "$BIN" extract "https://build.protomaps.com/${BUILD}.pmtiles" "$out" --bbox="$bbox"
  "$BIN" show "$out"
done
