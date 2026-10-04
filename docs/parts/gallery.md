---
title: 部品集の見本
character: zundamon
subtitles: burn
se: none
glossary:
  キャッシュ: よく使うデータを近くに覚えておくしくみ
---

<!-- docs/parts.md の見本画像を作る台本。scripts/parts-docs.sh で画像を作り直す -->

## タイトル

部品集の見本なのだ。

:::title
部品集の見本
gmm で使える部品
:::

## 箇条書き

一つ目の項目なのだ。
二つ目の項目なのだ。
三つ目は強調するのだ。

:::bullets
- {1} 文に合わせて順に出る
- {2} 1画面 3〜4 項目がちょうどよい
- {3} 強調マーカーも引ける {!3}
:::

## コード

コードを見るのだ。
ここで、覚えておいた値を見ているのだ。

:::code lang=ts {1} highlight="{2}:2-3"
async function get(key: string) {
  const hit = cache.get(key);
  if (hit) return hit;
  return db.get(key);
}
:::

## テキストと要点

本文を出すのだ。
大事なことは、枠で囲むのだ。

:::text {1}
説明はナレーションに回し、画面には短い文だけを出す。
:::

:::callout {2}
画面はキーワード、説明は声で
:::

## 図解（横）

利用者からサーバーへ、サーバーからデータベースへつながるのだ。

:::diagram
- 利用者
-> HTTPS
- APIサーバー
->
- データベース {!1}
:::

## 図解（縦）

縦に並べることもできるのだ。

:::diagram direction=TB
- 書き込み
->
- キューに積む
->
- あとで処理
:::

## 数式

式も書けるのだ。

:::math {1}
\text{ヒット率} = \frac{\text{ヒット数}}{\text{アクセス数}}
:::

## 画像

画像も出せるのだ。

:::image src=../../examples/assets/hot-partition.png {1}
キャプションを付けられる
:::

## 用語カード

{term:キャッシュ}キャッシュは、よく使うデータを近くに覚えておくしくみなのだ。

:::term {1}
キャッシュ
:::
