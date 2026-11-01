---
title: 天国と地獄で覚えるIT用語 システム構成編
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
 1 本 1 テーマ（システム構成編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
システム構成編
:::

## MTBF と MTTR：故障の間隔と修理の時間 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: こしょうから こしょうまで
text: 故障から 故障まで

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: えむてぃーびーえふ へいきんかんかく
text: MTBF 平均間隔

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なおすのに かかるじかん
text: 直すのに かかる時間

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: えむてぃーてぃーあーるだよ
text: MTTR だよ

:::bullets
- {2} MTBF：平均故障間隔（長いほどよい） {!2}
- {4} MTTR：平均修理時間（短いほどよい） {!4}
:::

## 稼働率：動いている時間の割合 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かどうりつは うごくわりあい
text: 稼働率は 動く割合

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: えむてぃーびーえふを あわせてわる
text: MTBFを 合計で割る

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ちょくれつは かけざんだよ
text: 直列は 掛け算だよ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: へいれつは いちひくりょうほうこしょう
text: 並列は 1引く両方故障

:::math {2}
A = \frac{\text{MTBF}}{\text{MTBF} + \text{MTTR}}
:::
:::bullets
- {3} 直列：A × B（1 つ止まれば全体が止まる）
- {4} 並列：1 −（1 − A）（1 − B） {!4}
:::

## RAID：ディスクをまとめて使う chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でぃすくを まとめてつかう
text: ディスクを まとめて使う

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: れいどぜろは ぶんさんではやい
text: RAID0は 分散で速い

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: れいどわんは ふくせいで
text: RAID1は 複製で

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: れいどごは ぱりてぃだよ
text: RAID5は パリティだよ

:::bullets
- {2} RAID0：分散して書く（速いが冗長性なし）
- {3} RAID1：同じ内容を 2 台に（ミラーリング）
- {4} RAID5：パリティを分散（1 台の故障まで） {!4}
- {4} RAID6：パリティ 2 つ（2 台の故障まで）
:::

## フェールセーフとフェールソフト chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: こわれたら あんぜんにとめる
text: 壊れたら 安全に止める

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ふぇーるせーふ しんごうはあかに
text: フェールセーフ 信号は赤に

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ふぇーるそふと きのうおとし
text: フェールソフト 機能落とし

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: うごきつづける しゅくたいうんてん
text: 動き続ける 縮退運転

:::bullets
- {1} フェールセーフ：故障したら安全側に止める {!2}
- {2} 例：故障したら信号を赤にする
- {3} フェールソフト：機能を落として動き続ける {!3}
- {4} ＝ 縮退運転
:::

## スケールアップとスケールアウト chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いちだいを つよくする
text: 1台を 強くする

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: すけーるあっぷだ せいのうあっぷ
text: スケールアップだ 性能アップ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: だいすうを ふやすのは
text: 台数を 増やすのは

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: すけーるあうと くらうどむき
text: スケールアウト クラウド向き

:::bullets
- {1} スケールアップ：1 台の性能を上げる（CPU・メモリを増やす） {!2}
- {3} スケールアウト：台数を増やして処理を分ける {!4}
- {4} クラウドの Web サーバなどに向く
:::

## ホット・ウォーム・コールドスタンバイ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: よびのきを まっておく
text: 予備の機を 待っておく

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ほっとすたんばい きどうずみだ
text: ホットスタンバイ 起動済みだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すぐかわれる こーるどは
text: すぐ代われる コールドは

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: とまったまま まっているよ
text: 止まったまま 待っているよ

:::bullets
- {2} ホットスタンバイ：待機系が起動済み（すぐ切り替わる） {!2}
- {3} ウォームスタンバイ：一部だけ準備済み
- {4} コールドスタンバイ：停止中（切り替えに時間がかかる） {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- MTBF と MTTR：故障の間隔と修理の時間
- 稼働率：動いている時間の割合
- RAID：ディスクをまとめて使う
- フェールセーフとフェールソフト
- スケールアップとスケールアウト
- ホット・ウォーム・コールドスタンバイ
:::
