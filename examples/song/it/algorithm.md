---
title: 天国と地獄で覚えるIT用語 アルゴリズム編
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
 1 本 1 テーマ（アルゴリズム編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
アルゴリズム編
:::

## スタック：後入れ先出し（LIFO） chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あとからいれ さきにだす
text: 後から入れ 先に出す

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: すたっくは さらのつみかさね
text: スタックは 皿の積み重ね

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぷっしゅでいれ ぽっぷでだす
text: プッシュで入れ ポップで出す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: らいふぉって よぶんだよ
text: LIFOって 呼ぶんだよ

:::bullets
- {1} 後に入れたものを先に出す {!1}
- {2} 例：皿の積み重ね・関数の呼び出し
- {3} push で積む ／ pop で取り出す
- {4} LIFO（Last In, First Out） {!4}
:::

## キュー：先入れ先出し（FIFO） chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さきにいれ さきにだすのは
text: 先に入れ 先に出すのは

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: きゅーだよ れじのぎょうれつだ
text: キューだよ レジの行列だ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: えんきゅーで うしろにいれる
text: エンキューで 後ろに入れる

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: でっきゅーで まえからだす
text: デキューで 前から出す

:::diagram
- {3} 入れる（enqueue）
->
- {2} キュー {!2}
->
- {4} 出す（dequeue）
:::
:::bullets
- {1} 先に入れたものを先に出す（FIFO） {!1}
- {2} 例：レジの行列・印刷待ち
:::

## 2 分探索：半分ずつ絞る chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ならべたら はんぶんずつ
text: 並べたら 半分ずつ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: まんなかとくらべ しぼりこんでく
text: 真ん中と比べ 絞り込んでく

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: にぶんたんさく はやいのだ
text: 2分探索 速いのだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: おーだーは ろぐえぬだよ
text: オーダーは log n だよ

:::bullets
- {1} 整列済みのデータが前提 {!1}
- {2} 真ん中と比べて、探す範囲を半分にする
- {4} 計算量 O(log n) {!4}
:::
:::callout {3}
1000 件でも約 10 回で見つかる
:::

## ハッシュ：キーから場所を計算する chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: きーからいちを けいさんする
text: キーから位置を 計算する

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: はっしゅほうなら いっぱつでとどく
text: ハッシュ法なら 一発で届く

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ばしょがぶつかる しのにむだ
text: 場所がぶつかる シノニムだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: べつのばしょを さがすのだ
text: 別の場所を 探すのだ

:::diagram
- {1} キー
-> {1} ハッシュ関数
- {2} 格納位置 {!2}
:::
:::bullets
- {3} 位置が衝突したキー ＝ シノニム {!3}
- {4} 空きを探す（オープンアドレス法）／リストでつなぐ（チェイン法）
:::

## クイックソート：基準で分けて並べる chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ならべかえ くいっくそーと
text: 並べ替え クイックソート

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: きじゅんでわける おおかしょうか
text: 基準で分ける 大か小か

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: へいきんは えぬろぐえぬ
text: 平均は n log n

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: さいあくは えぬのにじょう
text: 最悪は n の2乗

:::bullets
- {2} 基準値（ピボット）より小さいか大きいかで分け、それを繰り返す {!2}
- {3} 平均 O(n log n)（マージ・ヒープソートも同じ） {!3}
- {4} 最悪 O(n²) {!4}
:::

## 計算量（オーダ）：データが増えたときの時間の増え方 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でーたがふえて じかんどうなる
text: データが増えて 時間どうなる

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: けいさんりょうは おーだーでかく
text: 計算量は オーダーで書く

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: せんけいたんさく えぬにひれい
text: 線形探索 n に比例

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ばぶるそーとは えぬのにじょう
text: バブルソートは n の2乗

:::callout {2}
O(log n) ＜ O(n) ＜ O(n log n) ＜ O(n²)
:::
:::bullets
- {1} データ量 n が増えたときの、処理時間の増え方
- {3} 線形探索 O(n) ／ 2 分探索 O(log n)
- {4} バブル・選択・挿入ソート O(n²) {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- スタック：後入れ先出し（LIFO）
- キュー：先入れ先出し（FIFO）
- 2 分探索：半分ずつ絞る
- ハッシュ：キーから場所を計算する
- クイックソート：基準で分けて並べる
- 計算量（オーダ）：データが増えたときの時間の増え方
:::
