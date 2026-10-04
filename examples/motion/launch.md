---
title: gmm 紹介
layout: motion
bpm: 120
bgm: maou:neorock54     # 明るく疾走感のあるネオロック。テンポは曲から測って場面をそろえる
subtitles: none
---

<!--
製品紹介（約80秒・ナレーションなし）。先に見本を書き出しておくこと（:::clip が使う）:
  gmm build examples/duo/http-status.md / examples/rta/sample-run.md / examples/motion/mv.md / examples/motion/data-story.md

話の流れ（各場面が、前の場面の「次に知りたいこと」に答えるように並べる）
  1 動機     解説動画を作りたい
  2 困りごと  でも、やることが多い（原稿・声・字幕・画面・BGM）→ 何時間もかかる
  3 解決     そこで → gmm。台本を書くだけで動画になる（ここで初めて名前を出す）
  4 全体像   やることは3つだけ（書く・動かす・直す）← 手順に入る前に地図を見せる
  5〜7 手順  STEP 1 書く → STEP 2 動かす → STEP 3 AI が直す（左に手順、右に実物）
  8 結果     すると、こんな動画になる（実際に書き出した4本）
  9 ほかに   作るのを助ける仕組み（用語の説明漏れ・口パク・読み・部分書き出し…）
  10 締め    gmm / 台本から、動画へ。
-->

## 動機 beats=8
:::backdrop style=gradient :::
:::kinetic style=slide every=4 {beat:1}
解説動画を
**作りたい。**
:::

## 困りごと beats=16 transition=flash
:::backdrop style=gradient :::
:::kinetic style=pop area=top {beat:1}
でも、やることが多い
:::
:::features every=1 area=bottom columns=5 {beat:3}
- 原稿
- 声の録音
- 字幕
- 画面づくり
- BGM
:::

## 時間 beats=8 transition=cut
:::backdrop style=particles :::
:::kinetic style=blur {beat:1}
**何時間**もかかる。
:::

## そこで beats=4 transition=zoom
:::backdrop style=rays :::
:::kinetic style=slide {beat:1}
そこで
:::

## 解決 beats=12 transition=flash
:::backdrop style=rays :::
:::hero style=reveal {beat:1}
gmm
台本を書くだけで、動画になる。
:::

## 全体像 beats=12 transition=wipe
:::backdrop style=gradient :::
:::kinetic style=pop area=top {beat:1}
やることは **3つ** だけ
:::
:::features every=1 area=bottom columns=3 {beat:3}
- 1 書く: 台本を Markdown で
- 2 動かす: コマンドひとつ
- 3 直す: AI が検査して直す
:::

## 1 書く beats=16 transition=slide
:::backdrop style=gradient :::
:::step n=1 of=3 area=left {beat:1}
台本を書く
話すことと、画面に出すことを
Markdown で書くだけ
:::
:::editor src=../duo/http-status.md lines=37-48 area=right beats=12 {beat:2}
:::

## 2 動かす beats=16 transition=slide
:::backdrop style=gradient :::
:::step n=2 of=3 area=left {beat:1}
コマンドひとつ
声・字幕・画面・曲まで
まとめて動画に
:::
:::terminal area=right title="~/videos" {beat:2}
$ gmm build http-status.md
[gmm] 音声: 15文 provider=voicevox
[gmm] タイムライン: 5シーン / 57.5秒
検査OK: 問題は見つかりませんでした
[gmm] 映像: 5シーンを書き出します
[gmm] 結合中…
動画: build/http-status/video.mp4
:::

## 3 直す beats=16 transition=slide
:::backdrop style=gradient :::
:::step n=3 of=3 area=left {beat:1}
AI が直す
はみ出し・重なりを検査して
台本を自分で直す
:::
:::terminal area=right title="Claude Code" every=1.5 {beat:2}
$ gmm check http-status.md
[ERROR] overflow: s03 図解がはみ出しています
  → 箱を減らすか direction=TB に
✎ 台本を直しました（direction=TB）
$ gmm check http-status.md
検査OK: 問題は見つかりませんでした
:::

## すると beats=4 transition=zoom
:::backdrop style=stars :::
:::kinetic style=pop {beat:1}
すると、**こんな動画**に
:::

## 結果 beats=20 transition=flash
:::backdrop style=stars :::
:::clip src=../../build/http-status/video.mp4 start=18.5 area=tl {beat:1}
解説・掛け合い
:::
:::clip src=../../build/sample-run/video.mp4 start=20 area=tr {beat:2}
ゲーム実況（RTA）
:::
:::clip src=../../build/data-story/video.mp4 start=8 area=bl {beat:3}
データの物語
:::
:::clip src=../../build/mv/video.mp4 start=4 area=br {beat:4}
音に合わせた MV
:::

## ほかに beats=16 transition=wipe
:::backdrop style=gradient :::
:::kinetic style=pop area=top {beat:1}
作るのを助ける仕組みも
:::
:::features every=1 area=bottom columns=3 {beat:3}
- 用語のチェック: 説明していない専門用語を見つける
- 口パク・表情: 声に合わせて立ち絵が動く
- 読みの指定: 読み間違える語を直す
- 部分書き出し: 直した場面だけ作り直す
- 曲の合成: 拍に合った BGM をコードで
- スキル: Claude Code が手順どおりに作る
:::

## 締め beats=16 transition=flash
:::backdrop style=rays :::
:::hero style=zoom {beat:1}
**gmm**
台本から、動画へ。
:::
