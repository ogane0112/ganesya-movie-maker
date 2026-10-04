# 台本の書き方（早見表）

詳しくは README.md の「台本フォーマット」。完成例は `examples/partition-key.md`（約 4 分）。

## フロントマター

```markdown
---
title: 動画の題名
theme: wakaba            # wakaba / dark / テーマJSONのパス
voice: zundamon          # VOICEVOX の話者（zundamon / metan / tsumugi / 話者ID）
character: zundamon      # 立ち絵（zundamon / builtin / none）
subtitles: burn          # 字幕（burn / srt / none）
se: default              # 場面転換の効果音（default / none / ファイル）
bgm: maou:acoustic50     # BGM（gmm bgm list の名前か、手元のファイルのパス）。音量は自動でそろう
bgmVolume: 0.3           # ナレーションがないときの BGM の大きさ（1.0 でナレーションと同じ）
glossary:                # 専門用語（必ずどこかで説明する）
  ハッシュ値: キーから計算した数値。同じキーなら必ず同じ値になる
readings:                # 読みの辞書（字幕は表記のまま）
  S3: エススリー
---
```

## シーンとナレーション

```markdown
## 見出し                       ← シーン（見出しは画面上部に出る）

{face:normal}一文目なのだ。     ← 。！？と改行で文に分かれる。文頭に印を付けられる
{term:ハッシュ値}ハッシュ値は、キーから計算した数値のことなのだ。   ← この文で用語を説明している
{S3|エススリー}に保存するのだ。  ← 字幕は「S3」、読みは「エススリー」
```

文頭の印（順不同・複数可）：`{face:表情}` `{term:用語}`。印だけの行は次の文に付く。

ずんだもんの表情: normal / smile / surprised / troubled / think / angry
（組み込みキャラは angry がなく normal / smile / surprised / troubled / think。ずんだもんの表情は `characters/zundamon/character.json` で増やせる）

## 掛け合い（2人で話す）

```markdown
---
speakers:                # 話者: VOICEVOX の声（1人目が左、2人目が右に立つ）
  めたん: metan
  ずんだもん: zundamon
characters:              # 話者: 立ち絵
  めたん: metan
  ずんだもん: zundamon
---

## 見出し

ずんだもん: {face:smile}説明する文なのだ。
続けて同じ人が話す文なのだ。      ← 話者を書かない行は直前の話者
めたん: {face:think}聞き返す文ね。
```

- 役割の目安：ずんだもん = 解説役、四国めたん = 聞き役（疑問・まとめ・ツッコミ）。聞き役の問いで話を進める
- 表情は話者ごとに続く。四国めたんの表情: normal / smile / surprised / troubled / think / angry
- 部品は2人の間（中央）に出るので、1人のときより横幅が狭い。コードは 1 行 50 文字くらいまでにする

## 部品

`{n}` = n 番目の文が始まるときに出す（省略時はシーン冒頭）。`{!n}` = n 番目の文で強調する。

| 部品 | 書き方 |
| --- | --- |
| タイトル | `:::title` 1行目に題名、2行目にサブタイトル（表紙・エンディング用） |
| 箇条書き | `:::bullets` の中に `- {n} 項目 {!n}`。文中で `$x^2$` の数式も書ける |
| コード | `:::code lang=ts {n} highlight="{1}:2 {3}:4-5"`（文 1 で 2 行目、文 3 で 4〜5 行目を強調） |
| 本文 / 要点 | `:::text {n}` / `:::callout {n}` |
| 用語カード | `:::term {n}` 1行目に用語（2行目に説明。省略時は glossary の説明） |
| 図解 | `:::diagram`（`direction=TB` で縦）の中に `- {n} 箱 {!n}` と `-> {n} ラベル` を交互に |
| 数式 | `:::math {n}` の中に TeX |
| 画像 | `:::image src=assets/x.png {n}` の中にキャプション |

## 量の目安（検査のしきい値）

- 箇条書き 6 項目まで（読みやすさは 3〜4 項目）、コード 14 行まで、図解の箱 5 個まで
- 1 画面の文字数 160 字まで
- 1 文 12 秒まで、字幕 2 行まで
- 部品は出てから 1.5 秒以上見せる
- 既定以外の表情は 4 文まで続けてよい
