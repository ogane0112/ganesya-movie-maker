---
title: gmm 紹介
layout: motion
bpm: 120
bgm: synth:drive
subtitles: none
---

<!--
製品紹介（約50秒・ナレーションなし）。何ができて、どう使うのかを「使っている様子」で見せる。
  書く（エディタ）→ 動かす（ターミナル）→ AI が検査して直す → できた動画（実際の書き出し）→ できること → 締め
先に見本を書き出しておくこと（:::clip が使う）:
  gmm build examples/duo/http-status.md / examples/rta/sample-run.md / examples/motion/mv.md / examples/motion/data-story.md
-->

## つかみ beats=8
:::backdrop style=grid :::
:::hero style=reveal {beat:1}
gmm
台本を書くだけで、動画になる。
:::

## 問い beats=8 transition=flash
:::backdrop style=gradient :::
:::kinetic every=2
解説動画、
作るのに**何時間**？
:::

## 1 書く beats=16 transition=slide
:::backdrop style=gradient :::
:::kinetic style=slide mode=stack area=left every=2 {beat:1}
**1** 台本を書く
話すことと
画面に出すこと
:::
:::editor src=../duo/http-status.md lines=37-48 area=right beats=12 {beat:2}
:::

## 2 動かす beats=16 transition=slide
:::backdrop style=gradient :::
:::kinetic style=slide mode=stack area=left every=2 {beat:1}
**2** コマンド1つ
声・字幕・画面・
曲までまとめて
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
:::kinetic style=slide mode=stack area=left every=2 {beat:1}
**3** AI が検査して
はみ出し・重なりを
自分で直す
:::
:::terminal area=right title="Claude Code" every=1.5 {beat:2}
$ gmm check http-status.md
[ERROR] overflow: s03 図解がはみ出しています
  → 箱を減らすか direction=TB に
✎ 台本を直しました（direction=TB）
$ gmm check http-status.md
検査OK: 問題は見つかりませんでした
:::

## できあがり beats=4 transition=zoom
:::backdrop style=stars :::
:::kinetic style=pop
**できあがり**
:::

## できた動画 beats=20 transition=flash
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

## できること beats=16 transition=wipe
:::backdrop style=gradient :::
:::features every=1 {beat:1}
- 解説動画: ずんだもんが説明。用語の説明漏れも検査
- 掛け合い: めたんと2人で、向かい合って話す
- ゲーム実況: 録画に時刻つきの実況。タイマーも自動
- モーション: 文字・グラフ・3D が拍に合わせて動く
- スライドから: Marp を台本の下書きに
- AI と一緒に: Claude Code のスキルで、作る→直す
:::

## 締め beats=16 transition=flash
:::backdrop style=rays :::
:::hero style=zoom {beat:1}
**gmm**
台本から、動画へ。
:::
