# 曲を作る・歌わせる（`layout: song`）

コード進行とメロディと歌詞を書くと、伴奏をコードで合成し、VOICEVOX の歌唱機能でずんだもんたちが歌う。
歌詞がカラオケで色付いていく動画（歌う人が拍に合わせて弾み、口は歌に合わせて動く）も書き出せる。
`singer: none` にすると歌なしの曲（楽器がメロディを弾く）になり、ほかの動画の BGM にも使える。

```sh
./bin/gmm.mjs new song songs/my-song.md      # 見本から始める
./bin/gmm.mjs song songs/my-song.md          # 曲だけ作る → build/my-song/song.wav と歌詞の subtitles.srt
./bin/gmm.mjs check songs/my-song.md         # 書式・歌える高さ・画面を確かめる
./bin/gmm.mjs render songs/my-song.md        # 歌詞カラオケの動画
```

見本：[examples/song/zunda-mochi.md](../examples/song/zunda-mochi.md)（ハ長調・128 BPM・約47秒）

歌わせるには VOICEVOX エンジン（歌唱に対応した 0.16 以降）が要る。つながらないときは、歌の代わりに楽器でメロディを弾く（`check` / `frames` はそれで回せる）。

## フロントマター

```yaml
---
title: ずんだもちのうた
layout: song
bpm: 128              # テンポ
music: pop            # 伴奏の型: pop / rock / ballad / chiptune / edm
singer: zundamon      # 歌う声。zundamon / metan / tsumugi / hau / ritsu / takehiro / kotaro / ryusei / himari / sora
                      #   "zundamon:あまあま" でスタイル、歌唱スタイルの ID でも可。none で歌なし
transpose: 0          # 全体を半音でずらす（-12〜12）。高すぎる・低すぎるときに
character: builtin    # 真ん中で歌う立ち絵（none / builtin / zundamon / characters/<名前>/ …）
format: wide          # wide / short（縦長）/ square
theme: pop
---
```

| 伴奏 | 感じ | 合う曲 |
| --- | --- | --- |
| `pop` | ピアノの和音・8 ビート・サビでアルペジオ | 明るい歌、テーマソング |
| `rock` | 歪んだギター・速めの 8 ビート | 元気な歌、オープニング |
| `ballad` | ピアノのアルペジオ・ゆったりしたドラム・伸ばし | しっとりした歌、エンディング |
| `chiptune` | ピコピコの矩形波・速いアルペジオ | ゲームっぽい歌 |
| `edm` | 4 つ打ち・うねる伸ばし（サイドチェイン） | ダンス、ネタ曲 |

## セクション

```markdown
## サビ chords="F G Em Am | F G C C" energy=high bg=sunburst
```

- `chords=`：1 小節に 1 つのコード（`|` は読みやすさのための区切り）。`"G,G7"` で 1 小節を半分ずつ。
  使えるコード：`C` `Cm` `C7` `CM7` `Cm7` `Csus4` `Csus2` `Cdim` `Caug` `Cadd9` `C6` `C9` `Cm7b5` と分数コード `C/E`（シャープ・フラットは `F#` `Bb`）
- `energy=`：`low`（ドラムなし・伸ばし）/ `mid` / `high`（全部の楽器・頭でシンバル）。省略すると見出しから決まる（サビ → high、アウトロ → low、ほか mid）。
  high の前のセクションの最後にはドラムのフィルが入る
- `bars=`：長さ（小節）。省略するとコードとメロディの長いほう。コードが短ければ繰り返す
- `grid=`：1 小節の升目の数（既定 8 = 8 分音符。16 で 16 分音符、12 で 3 連符）
- `bg=` / `transition=`：動画の背景と入り方（ネタ動画と同じ。省略すると盛り上がりで決まる）

メロディのないセクション（イントロ・間奏・アウトロ）は伴奏だけ。最初のセクションが前奏なら、題名が帯で出る。

## メロディと歌詞

```markdown
melody: C5 C5 A4 - C5 C5 A4 - | G4 G4 A4 G4 E4 - - - |
lyrics: ずんだずんだ ずんだもち
text: ずんだ ずんだ ずんだ餅
```

- `melody:` は 1 つが 1 升（既定は 8 分音符、1 小節 = 8 升）。音名は `C4`（真ん中のド）`F#4` `Bb3`。`-` で前の音を伸ばし、`.` で休む。
  `|` で小節を区切ると、各小節が 8 升ちょうどかを確かめる（ずれていたらエラー）
- `lyrics:` はひらがな・カタカナ。**音符 1 つに 1 音**：「きゃ」「しょ」は 1 音、「っ」「ん」も 1 音、「ー」は前の音の母音（「だー」→「だ」「あ」）。空白は無視する
- `text:` は画面に出す歌詞（漢字まじり）。省略すると `lyrics:` のまま
- `melody:` から次の `melody:` までが 1 フレーズ（字幕 1 行）。フレーズはセクションの頭から続けて並ぶ（間を空けるなら `.` で休む）
- 1 フレーズは 2 小節くらいが読みやすい

## 作曲のコツ（AI が書くとき）

- 歌いやすい高さは `G3`〜`A5`（`gmm check` が外れた音を知らせる）。ずんだもん・めたんは `C4`〜`C5` 中心がよい
- 小節の頭・強い拍（1・3 拍目）の音は、その小節のコードの音（C なら ド・ミ・ソ）にする。経過音は弱い拍に
- 跳躍は 5 度くらいまで。大きく跳んだら反対向きに少し戻る
- サビは A メロより高く（3〜5 度上）、同じ言葉・同じリズムを繰り返して覚えやすく
- 言葉のアクセントとメロディの上下をそろえると聞き取りやすい（「あめ（雨）」は高→低）
- フレーズの終わりは伸ばす（`- - -`）か休んで、息つぎの間を作る
- 定番の進行：`C G Am F`（王道）、`F G Em Am`（王道進行）、`Am F G C`（切ない）、`C Am F G`（50 年代）

## 曲を BGM に使う

`gmm song x.md` が作った `build/x/song.wav` を、ほかの台本の `bgm:` に台本からの相対パスで書く（歌なしの曲は `singer: none`）。

## 権利

歌声は VOICEVOX の各キャラクターの規約に従う（`credits.txt` に「VOICEVOX:ずんだもん」などを出す）。伴奏はコードで合成したもので、素材の権利はない。
