#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT}/../dnd-24-resources"
DST="${ROOT}/content/srd-markdown"

if [[ ! -d "${SRC}" ]]; then
  echo "error: source repo not found at ${SRC}" >&2
  exit 1
fi

mkdir -p "${DST}"

cp -R "${SRC}/chapters" "${DST}/"
cp "${SRC}/SRD_CC_v5.2.1.combined.md" "${DST}/"
cp "${SRC}/ATTRIBUTION.md" "${DST}/"

echo "Synced SRD content from ${SRC} -> ${DST}"
