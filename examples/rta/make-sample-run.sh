#!/usr/bin/env bash
# 仕組みを試すための「仮のゲーム録画」を作る（本物のゲームではない）。
# 4:3・640x480・30fps・約2分30秒。タイトル → 1-1 → ロード（暗転）→ 1-2 → ロード → ボス → クリア
set -euo pipefail
cd "$(dirname "$0")"
FONT=${FONT:-$(fc-match -f '%{file}' 'DejaVu Sans:bold' 2>/dev/null || echo /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf)}
OUT=${1:-sample-run.mp4}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

seg() { # 名前 秒数 背景色 映像フィルタ 音の周波数(0で無音)
  local name=$1 dur=$2 bg=$3 vf=$4 freq=$5
  local audio="anullsrc=r=44100:cl=stereo"
  [ "$freq" != 0 ] && audio="sine=frequency=$freq:sample_rate=44100,volume=0.15,aformat=channel_layouts=stereo"
  ffmpeg -v error -y -f lavfi -i "color=c=$bg:s=640x480:r=30:d=$dur" -f lavfi -t "$dur" -i "$audio" \
    -vf "$vf" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$TMP/$name.mp4"
  echo "file '$TMP/$name.mp4'" >> "$TMP/list.txt"
}
text() { echo "drawtext=fontfile=$FONT:text='$1':fontcolor=$2:fontsize=$3:x=(w-text_w)/2:y=$4"; }
ground="drawbox=x=0:y=400:w=640:h=80:color=0x3b7a2a:t=fill"
player="drawbox=x='mod(t*110\,600)':y=352:w=40:h=48:color=0xffd23f:t=fill"
hud() { text "$1" white 22 14; }

seg title 6 0x1b2a4a "$(text 'SAMPLE QUEST' white 56 150),$(text 'PRESS START' 0xffd23f 28 300)" 440
seg stage1 44 0x8ecae6 "$ground,$player,drawbox=x=300:y=330:w=60:h=70:color=0x6b4226:t=fill,$(hud 'STAGE 1-1')" 523
seg load1 4 black "null" 0
seg stage2 46 0xf4a261 "$ground,$player,drawbox=x='200+80*sin(t*2)':y=300:w=50:h=20:color=0x264653:t=fill,$(hud 'STAGE 1-2')" 587
seg load2 4 black "null" 0
seg boss 36 0x3d0c11 "$ground,$player,drawbox=x='420+20*sin(t*9)':y=230:w=160:h=170:color=0xb5179e:t=fill,$(hud 'BOSS')" 392
seg clear 10 0x1b2a4a "$(text 'STAGE CLEAR' 0xffd23f 60 180),$(text 'THANK YOU FOR PLAYING' white 26 300)" 659

ffmpeg -v error -y -f concat -safe 0 -i "$TMP/list.txt" -c copy "$OUT"
echo "$OUT"
