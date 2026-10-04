---
title: モーション部品の見本
layout: motion
bpm: 120
subtitles: none
---

<!-- docs/motion.md の見本画像を作る台本。scripts/parts-docs.sh で画像を作り直す -->

## kinetic beats=4
:::backdrop style=gradient :::
:::kinetic
**大きな**文字
:::

## counter beats=6
:::backdrop style=gradient :::
:::counter value=1200000 prefix=¥ beats=3
数え上がる数字
:::

## chart beats=8
:::chart title="棒グラフ" unit=件 beats=3
- 東京: 120
- 大阪: 80
- 福岡: 150 !
:::

## chart-line beats=8
:::chart kind=line title="折れ線グラフ" beats=3
- 1月: 10
- 2月: 30
- 3月: 25
- 4月: 60 !
:::

## history beats=8
:::history every=2
- 2020: 始まり
- 2023: 広まる
- 2026: いま
:::

## hero beats=4
:::backdrop style=rays :::
:::hero style=reveal
大きな題名
サブタイトル
:::

## backdrop-grid beats=2
:::backdrop style=grid :::

## backdrop-particles beats=2
:::backdrop style=particles :::

## shot beats=6
:::backdrop style=gradient :::
:::shot src=../../examples/assets/hot-partition.png frame=browser
画面写真を端末の枠に
:::

## three-globe beats=4
:::three preset=globe :::

## three-cubes beats=4
:::three preset=cubes :::

## custom beats=4
:::backdrop style=stars :::
:::custom src=../../examples/motion/scenes/orbit-words.tsx center=custom :::
