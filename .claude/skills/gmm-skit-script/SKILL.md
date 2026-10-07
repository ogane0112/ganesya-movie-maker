---
name: gmm-skit-script
description: gmm のネタ動画（layout: skit。縦長のショート動画・あるある・ミーム風のネタ、ゆっくり解説・ゆっくり茶番、吹き出しのアニメ寸劇）の構成と台本を書く・直す機能スキル。起承転結とオチの組み立て、画面の形（format）と型（style）、台詞に挟む指示（!caption テロップ・!se 効果音・!stamp・!pic・!enter/!exit・!wait の間）と文頭の印（{act:動き} {fx:画面効果} {se:効果音}）、まんじゅう型のキャラ、外部の読み上げソフトの声まで。gmm スキルの工程として使う。「ショート動画を作って」「ネタ動画」「ゆっくり解説」「茶番」「アニメっぽい寸劇」と単独で頼まれたときも使う。
---

# ネタ動画・ショート・ゆっくり・寸劇の台本を書く

書式と一覧は `docs/skit.md`。見本は `examples/skit/`（short / yukkuri / anime）。`./bin/gmm.mjs new <型> <台本>` で見本から始められる。
効果音・動き・画面効果の名前は `./bin/gmm.mjs se list`。

ゲーム録画にゆっくりの実況を付けるときは、このスキルではなく `gmm-rta-script` を `biimFrame: yukkuri` で使う。

## 入力

- 型：ショート（縦長・20〜60 秒）／ゆっくり解説・茶番（横長・1〜5 分）／寸劇（横長・30 秒〜2 分）
- ネタ（何がおもしろいか・オチ）、登場人物（2 人が基本）、使う画像があればその場所

## 手順

### 1. 型を決める

| 型 | フロントマター | 立ち絵 | 字幕 |
| --- | --- | --- | --- |
| ショート・ネタ | `format: short` `style: meme` `banner: 題名` | `builtin` / `builtin-metan` / ずんだもん等 | 太字（bold） |
| ゆっくり解説・茶番 | `format: wide` `style: yukkuri` | `manju-red` / `manju-witch`（まんじゅう型） | 話者の色の文字（yukkuri） |
| 寸劇・アニメ | `format: wide` `style: anime` | `builtin` / `builtin-blue` / 立ち絵素材 | 吹き出し（bubble） |

- 声は `speakers:` に。キャラに合わせて `"metan pitch=0.05 speed=1.2"` のように高さ・速さを変えてよい。
  ゆっくりの声（AquesTalk など）を使いたいと言われたら `exec:<名前>` と `~/.config/gmm/voices.json`（`docs/skit.md`）を案内する。
  設定ファイルは利用者が置くもの。勝手に作らない

### 2. 先に「流れ」を書く（必ず）

台本の頭のコメントに、場面ごとの役割を1行ずつ書く（`examples/skit/short.md` の冒頭）。

- **オチから逆算する**。最後の 1 台詞（とその後の `!se chin`・`!caption ～完～`）を先に決め、そこへ向かう前振りを置く
- ショート：起（あるある・状況）→ 承（悪化・ボケ）→ 転（追い込み。`bg=speed` の集中線）→ 結（オチ）。最初の 2 秒で `!caption … style=impact` と `!se dodon` で掴む
- ゆっくり解説：挨拶 → 問い → 答え（要点は `!caption`、補足は `style=note`）→ まとめ → オチ。解説の中身は正確に（専門用語は `gmm-terms`）
- 寸劇：登場（`!exit` で隠しておき `!enter … right` と `{se:whoosh}`）→ ズレ → 発覚（`{fx:lines}{act:spin}{se:kira}`）→ ツッコミとオチ

### 3. 台詞と演出を書く

- 台詞は短く（1 文 3 秒・字幕 2 行まで）。長い説明は 2 人に分けて相づちを挟む
- ボケの後に `!wait 0.5` で間を置いてからツッコミ。ツッコミ側は `{act:shake}` や `{fx:shake}`、効果音は `buzzer`
- 驚きは `{face:surprised}{fx:zoom}{se:don}`、がっかりは `{act:shrink}` か `{act:fall}{se:zukoo}`、喜びは `{act:jump}`
- 表情は次の指定まで続く。驚きの後は区切りで `{face:normal}` に戻す
- **やりすぎない**：効果音は 1 台詞に 1 つまで、`zoom` `lines` `flash` は 1 場面に 1 回。全部の台詞に何か付けるとうるさい
- 大きなテロップ（impact / shout / title）は 1 行 14 文字まで。長いときは `\n` で 2 行に
- 画像（`!pic`）は台本からの相対パス。手元にない画像を想像で指定しない（ないなら文字のテロップで代える）
- 実在の人物・作品・商標をネタにするときは、からかい・なりすましにならないよう利用者に確かめる

### 4. 検査へ

`gmm-review` に進む（`gmm check` → `gmm frames --steps` で台詞ごとの画面を見る）。目で見ること：

- テロップ・スタンプが顔を隠していないか、吹き出しが画面の端で切れていないか
- オチの場面の最後に余韻があるか（最後の指示の後 1.4 秒）

## 終わりの条件

- 頭のコメントに流れがあり、オチがある
- `gmm check` が通る書式になっている（終了コード 2 でない）
- 次は（専門用語があれば `gmm-terms`）→ `gmm-bgm` → `gmm-review`
