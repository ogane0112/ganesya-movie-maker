#!/usr/bin/env bash
# docs/parts.md の見本画像（docs/parts/img/*.png）を作り直す。部品の見た目を変えたら実行する。
set -euo pipefail
cd "$(dirname "$0")/.."
./bin/gmm.mjs frames docs/parts/gallery.md --tts silent -o build/parts-gallery >/dev/null
mkdir -p docs/parts/img
for f in build/parts-gallery/frames/s[0-9][0-9].png; do
  ffmpeg -v error -y -i "$f" -vf scale=960:-1 "docs/parts/img/$(basename "$f")"
done
ls docs/parts/img
