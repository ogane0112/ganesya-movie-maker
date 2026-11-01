---
title: 天国と地獄で覚えるIT用語 プロジェクトマネジメント編
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
 1 本 1 テーマ（プロジェクトマネジメント編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
プロジェクトマネジメント編
:::

## ステークホルダ：関わる人たち chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぷろじぇくとに かかわるひと
text: プロジェクトに 関わる人

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: すてーくほるだ えいきょうしあう
text: ステークホルダ 影響し合う

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おきゃくさまや けいえいしゃ
text: お客様や 経営者

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: めんばーも みんなそうだ
text: メンバーも みんなそうだ

:::bullets
- {1} プロジェクトに影響する・影響される人や組織 {!2}
- {3} 顧客・経営者・メンバー・利用者など
:::

## WBS：作業を階層に分ける chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さぎょうをね かいそうにわけ
text: 作業をね 階層に分け

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: だぶりゅーびーえす ぶんかいずだ
text: WBS 分解図だ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いちばんしたの さぎょうのこと
text: 一番下の 作業のこと

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: わーくぱっけーじだよ
text: ワークパッケージだよ

:::diagram direction=TB
- {2} システム開発
->
- {3} 設計 ／ 製造 ／ テスト
->
- {4} ワークパッケージ（最下層の作業） {!4}
:::

## クリティカルパス：余裕ゼロの最長経路 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: よゆうがぜろの さぎょうのれつ
text: 余裕がゼロの 作業の列

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: くりてぃかるぱす いちばんながい
text: クリティカルパス 一番長い

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: どこかおくれたら ぜんぶおくれる
text: どこか遅れたら 全部遅れる

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ここをまもる ことがだいじ
text: ここを守る ことが大事

:::bullets
- {1} 余裕（フロート）0 の作業の連なり
- {2} 開始から終了までで最も長い経路 {!2}
- {3} 1 つでも遅れると全体が遅れる {!3}
:::

## ファストトラッキングとクラッシング chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おくれをとりもどす ほうほうは
text: 遅れを取り戻す 方法は

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ふぁすとらっきんぐ へいこうでやる
text: ファストトラッキング 並行でやる

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: くらっしんぐ しげんをたす
text: クラッシング 資源を足す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ひとをふやすから おかねがかかる
text: 人を増やすから お金がかかる

:::bullets
- {2} ファストトラッキング：本来は順番の作業を並行して進める {!2}
- {3} クラッシング：人や資源を追加して短縮する {!3}
- {4} クラッシングはコストが増える
:::

## 三点見積り chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: らっかんひかん さいかのうち
text: 楽観悲観 最可能値

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: さんてんみつもり よんばいして
text: 三点見積り 4倍して

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: みっつをたして ろくでわる
text: 3つを足して 6で割る

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: へいきんてきな みつもりだ
text: 平均的な 見積りだ

:::bullets
- {1} 楽観値・最可能値・悲観値の 3 つで見積もる
- {2} 最可能値を 4 倍に重み付け {!2}
:::
:::math {3}
\frac{\text{楽観値} + 4 \times \text{最可能値} + \text{悲観値}}{6}
:::

## EVM：出来高で進み具合を見る chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: けいかくと できだかと
text: 計画と 出来高と

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: じっさいのこすとで しんちょくをみる
text: 実際のコストで 進捗を見る

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: えすぴーあい いいぶいわるぴーぶい
text: SPI EV÷PV

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: いちみまんは おくれだよ
text: 1未満は 遅れだよ

:::bullets
- {1} PV（計画）・EV（出来高）・AC（実コスト）で管理 {!2}
- {3} SPI ＝ EV ÷ PV（スケジュール）
- {4} CPI ＝ EV ÷ AC（コスト）
- {4} 1 未満なら遅れ・予算超過 {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ステークホルダ：関わる人たち
- WBS：作業を階層に分ける
- クリティカルパス：余裕ゼロの最長経路
- ファストトラッキングとクラッシング
- 三点見積り
- EVM：出来高で進み具合を見る
:::
