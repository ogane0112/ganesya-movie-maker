---
title: 天国と地獄で覚えるIT用語 データベース編
layout: song
bpm: 120
music: pop
singer: zundamon
transpose: 3             # ハ長調 → 変ホ長調。歌いやすい高さに
fit: auto                # 歌詞の音の数に合わせて音符を分ける・まとめる
character: builtin
theme: pop
---

<!--
 メロディ：オッフェンバック「天国と地獄」（地獄のギャロップ／カンカン。1858 年・パブリックドメイン）の主題。
 1 升 = 16 分音符（grid=16）。原曲の 2/4 拍子の 2 小節を 1 小節にまとめている。
 1 本 1 テーマ（データベース編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
データベース編
:::

## 主キー：1 行を見分ける列 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いちぎょうを とくていする
text: 1行を 特定する

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: これがしゅきー ちょうふくだめだよ
text: これが主キー 重複ダメだよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: からっぽも ゆるされない
text: 空っぽも 許されない

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: がくせきばんごうなどだ
text: 学籍番号などだ

:::code lang=sql {1} highlight="{2}:2 {4}:2"
CREATE TABLE 学生 (
  学籍番号 INT PRIMARY KEY,
  氏名     VARCHAR(20)
);
:::
:::bullets
- {2} 同じ値は入れられない（一意） {!2}
- {3} 空（NULL）も入れられない
:::

## 外部キー：ほかの表とつなぐ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ほかのひょう しゅきーさすの
text: 他の表の 主キー指すの

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: がいぶきーで ひょうとひょうつなぐ
text: 外部キーで 表と表つなぐ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ないあたい いれられない
text: ない値 入れられない

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: さんしょうせいごうせいだ
text: 参照整合性だ

:::diagram
- {2} 注文（顧客ID）
-> {1} 参照
- {1} 顧客（顧客ID が主キー） {!2}
:::
:::bullets
- {3} 顧客表にない顧客IDは注文に入れられない
- {4} これを参照整合性という {!4}
:::

## 正規化：重複をなくす chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: せいきかは むだをへらす
text: 正規化は ムダを減らす

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: おなじでーた いっかいだけかく
text: 同じデータ 一回だけ書く

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ひょうをわけ むじゅんをけす
text: 表を分け 矛盾を消す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: だいさんまで すすめよう
text: 第3まで 進めよう

:::diagram
- {2} 注文表（全部入り）
-> {3} 分ける
- {3} 注文・顧客・商品 {!3}
:::
:::bullets
- {2} 同じデータは 1 か所だけに書く
- {3} 更新したのに古い値が残る矛盾を防ぐ
- {4} 第 1 → 第 2 → 第 3 正規形の順に進める {!4}
:::

## インデックス：検索を速くする索引 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さくいんで はやくさがす
text: 索引で 速く探す

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: いんでっくす ほんのさくいんだ
text: インデックス 本の索引だ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: つけすぎは おそくなるよ
text: 付けすぎは 遅くなるよ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かきこみがおもくなるよ
text: 書き込みが 重くなるよ

:::diagram
- {1} 検索（WHERE 氏名 = '田中'）
-> {2} 索引をたどる
- {1} 該当する行 {!1}
:::
:::bullets
- {2} 本の巻末の索引と同じ（B 木などで作る）
- {3} 付けすぎると、追加・更新のたびに索引も直すので遅い {!4}
:::

## ACID：トランザクションの 4 つの性質 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あしっどは しょりのきまり
text: ACIDは 処理の決まり

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: げんしせいは ぜんぶかぜろかだ
text: 原子性は 全部かゼロかだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: むじゅんなし どくりつせい
text: 矛盾なし 独立性

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: えいぞくせい きえないよ
text: 永続性 消えないよ

:::bullets
- {2} A 原子性：全部やるか、全部やらないか {!2}
- {3} C 一貫性：データに矛盾が出ない
- {3} I 独立性：同時に動いても干渉しない
- {4} D 永続性：確定したら消えない {!4}
:::

## ロック（排他制御）とデッドロック chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: どうじにね かきかえたら
text: 同時にね 書き換えたら

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: こわれちゃうの ろっくでまもろう
text: 壊れちゃうの ロックで守ろう

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おたがいに まちあったら
text: お互いに 待ち合ったら

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: でっどろっく うごけない
text: デッドロック 動けない

:::bullets
- {1} 同時に書き換えると、データが壊れる
- {2} ロック（排他制御）で 1 つずつ順番に {!2}
:::
:::diagram
- {3} 処理A（表1をロック中）
<-> {4} お互いの解放を待つ
- {3} 処理B（表2をロック中） {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- 主キー：1 行を見分ける列
- 外部キー：ほかの表とつなぐ
- 正規化：重複をなくす
- インデックス：検索を速くする索引
- ACID：トランザクションの 4 つの性質
- ロック（排他制御）とデッドロック
:::
