---
name: gmm-motion-script
description: gmm のモーション動画（layout: motion。製品・技術の紹介、音に合わせた MV 風、データ・歴史の物語、3D・エフェクト重視）の構成と台本を書く・直す機能スキル。拍（bpm）で場面を組み、組み込みの部品（大きな文字・数字・グラフ・年表・題名・背景・画面写真・3D）と、AI が書く場面のコード（:::custom の TSX）のどちらで作るかを決め、合成した曲（synth）を選ぶ。gmm スキルの工程として使う。「紹介動画を作って」「MVっぽく」「モーショングラフィックスで」「3Dで」と単独で頼まれたときも使う。
---

# モーション動画の台本を書く

書式と部品の一覧は `docs/motion.md`。見本は `examples/motion/`。

## 入力

- 何の動画か（紹介・MV 風・データの物語・3D）、長さ（既定：紹介 30 秒、MV 30〜60 秒、物語 1〜2 分）、ナレーションの有無
- 伝えたいこと（言葉・数字・年表・画面写真）。数字や年は出典を確かめられるものだけ使う

## 手順

### 1. 型を決める

| 型 | 拍と場面 | 曲 | よく使う部品 |
| --- | --- | --- | --- |
| 紹介（ローンチ） | 120 BPM、手順の場面は 16 拍 | `synth:drive` | hero → kinetic（問い）→ 手順ごとに kinetic（左）＋ editor / terminal（右）→ clip（できたもの）→ features → hero |
| MV 風 | 120〜128 BPM、8 拍ごとに場面、言葉は 1〜2 拍ごと | `synth:drive` / `synth:tech` | kinetic（replace / stack）・backdrop・three |
| データ・歴史の物語 | 80〜100 BPM、場面はナレーションに合わせる（beats= を書かない） | `synth:chill` / `synth:epic` | history・counter・chart・kinetic（締めの問い） |
| 3D・エフェクト | 120〜130 BPM、場面は 8 拍 | `synth:tech` / `synth:epic` | three・custom（3D）・hero |

### 製品・道具の紹介で必ずやること

- **使っている様子を見せる。** 文字だけで「便利」「すごい」と言わない。実物（`editor` で書くもの、`terminal` で動かすコマンドと出力、`clip` でできあがった動画、`shot` で画面写真）を見せる
- 手順ごとに1場面。左に説明の文字（`kinetic mode=stack area=left`）、右に実物（`area=right`）
- ターミナルの出力は、実際に動かしたときの出力を短くして使う（でっち上げない）
- 最後に「できること」（`features`）を3〜6個。1つは1行の説明つき

### 2. 部品で作るか、場面のコードを書くか

- **まず組み込みの部品で組めないか考える**（安定していて、検査が中まで測れる）
- 部品にない表現（独自の図形・図解が動く・凝った 3D・データに合わせた形）だけ、`:::custom` の場面のコードを書く
- 1本の中で混ぜてよい（背景は部品、主役だけコード、など）
- 場面のコードは `examples/motion/scenes/` を手本に、台本の隣の `scenes/` に置く。決まり：
  - `export default` の React 部品。受け取るのは `MotionSceneProps`（frame・beat・palette・props）
  - `Math.random()`・`Date`・`performance.now()`・`fetch()` は使わない（乱数は `random(seed)`）。姿はフレーム番号だけから決める
  - 色は `palette` から取る（テーマを変えても合うように）。文字には `data-gmm-text` を付ける
  - 動きは拍に合わせる：`beat.pulse`（拍の頭で 1）、`beat.framesPerBeat`、`ease(frame, 拍数 * framesPerBeat)`
  - 3D は `@remotion/three` の `ThreeCanvas`（`examples/motion/scenes/tunnel.tsx`）

### 3. 台本を書く

- フロントマター：`layout: motion`・`bpm:`・`bgm: synth:<プリセット>`・`subtitles:`（ナレーションがなければ `none`）
- 場面は `## 名前 beats=8 transition=…`。部品は背景 → 3D → 文字 の順に重ねる
- 大きな文字は 1 行 16 文字まで、一目で読める量に。強調は `**語**`
- 場面の入り方は変化を付けすぎない（`cut` を基本に、区切りで `flash` / `wipe` / `zoom`）
- ナレーションがあるときは、場面の長さはナレーションに任せる（beats= を書くなら収まるように）。専門用語は `gmm-terms`
- 曲は試聴できない。選んだプリセットと理由を最後に伝える

## 終わりの条件

- `./bin/gmm.mjs check <台本> --tts silent` の終了コードが 2 でない（書式エラーがない）。場面のコードの決まりもここで調べられる
- 次は（ナレーションがあれば `gmm-terms` →）`gmm-review`
