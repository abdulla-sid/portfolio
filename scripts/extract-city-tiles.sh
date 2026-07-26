#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BUILD=20260716                 # pinned Protomaps daily build (YYYYMMDD)
PMTILES_VERSION=1.31.1         # pinned go-pmtiles CLI release

CITIES=(
  "lahore=74.15,31.35,74.55,31.65"
  "islamabad=72.90,33.52,73.25,33.78"
)

BIN=scripts/.bin/pmtiles
if [ ! -x "$BIN" ]; then
  mkdir -p scripts/.bin
  curl -fL "https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VERSION}/go-pmtiles_${PMTILES_VERSION}_Linux_x86_64.tar.gz" \
    | tar -xz -C scripts/.bin pmtiles
fi

mkdir -p public/map
for entry in "${CITIES[@]}"; do
  name="${entry%%=*}"
  bbox="${entry#*=}"
  out="public/map/${name}.pmtiles"
  "$BIN" extract "https://build.protomaps.com/${BUILD}.pmtiles" "$out" --bbox="$bbox"
  "$BIN" show "$out"
done
