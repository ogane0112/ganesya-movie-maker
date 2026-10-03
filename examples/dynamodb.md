---
title: DynamoDBのパーティションキー入門
theme: wakaba
voice: zundamon
character: zundamon
---

## タイトル

:::title
DynamoDBのパーティションキー入門
キー設計で性能が決まる
:::

{face:smile}今日はDynamoDBのパーティションキーについて解説します。

## なぜキー設計が大事か

{face:normal}DynamoDBでは、データの置き場所がキーで決まります。
{face:troubled}キーが偏ると、一部のサーバーにアクセスが集中します。
これをホットパーティションと呼びます。

:::bullets
- {1} 置き場所はキーで決まる
- {2} 偏るとアクセスが集中する {!3}
- {3} ホットパーティション
:::

## 悪い例

{face:think}このコードでは日付をキーにしています。
{face:surprised}今日の日付に書き込みが集中してしまいます。

:::code lang=ts highlight="{1}:1 {2}:2"
const item = { pk: today, sk: userId };
await db.put(item);
:::

## 良い例

{face:smile}ユーザーIDをキーにすると、書き込みがばらけます。
アクセスの偏りがない値を選ぶのがコツです。

:::code lang=ts highlight="{1}:1"
const item = { pk: userId, sk: today };
await db.put(item);
:::

:::callout {2}
値が偏らないキーを選ぶ
:::
