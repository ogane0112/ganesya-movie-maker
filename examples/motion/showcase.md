---
title: 3D ショーケース
layout: motion
bpm: 128
bgm: synth:tech
subtitles: none
---

<!-- 3D・エフェクト重視（約20秒）。組み込みの 3D（:::three）と、AI が書いた場面のコード（:::custom）の見本 -->

## 地球 beats=8
:::three preset=globe :::
:::kinetic style=blur {beat:3}
**世界**とつながる
:::

## トンネル beats=8 transition=flash
:::custom src=scenes/tunnel.tsx :::
:::kinetic style=pop every=2 {beat:2}
加速する
**表現**
:::

## 言葉の軌道 beats=8 transition=glitch
:::backdrop style=stars :::
:::custom src=scenes/orbit-words.tsx center=gmm words="AI,動画,台本,音楽,3D,拍" :::

## 立方体 beats=8 transition=zoom
:::three preset=cubes :::
:::hero style=split {beat:3}
**コード**で描く
:::

## 締め beats=8 transition=wipe
:::three preset=particles :::
:::hero style=zoom {beat:2}
gmm motion
:::
