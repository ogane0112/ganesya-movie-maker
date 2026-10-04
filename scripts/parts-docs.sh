#!/usr/bin/env bash
# 部品集の見本画像を作り直す。部品の見た目を変えたら実行する。
#   docs/parts/img/*.png   … 解説動画の部品（docs/parts.md）
#   docs/motion/img/*.png  … モーション動画の部品（docs/motion.md）
set -euo pipefail
cd "$(dirname "$0")/.."
shrink() { # 書き出したキーフレームを幅 960 にして docs に置く
  mkdir -p "$2"
  for f in "$1"/frames/s[0-9][0-9].png; do ffmpeg -v error -y -i "$f" -vf scale=960:-1 "$2/$(basename "$f")"; done
}
./bin/gmm.mjs frames docs/parts/gallery.md --tts silent -o build/parts-gallery >/dev/null
shrink build/parts-gallery docs/parts/img
./bin/gmm.mjs frames docs/motion/gallery.md --tts silent -o build/motion-gallery >/dev/null
shrink build/motion-gallery docs/motion/img
ls docs/parts/img docs/motion/img
