---
title: 天国と地獄で覚えるIT用語 基礎理論編
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
 1 本 1 テーマ（基礎理論編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
基礎理論編
:::

## 2 の補数：負の数の表し方 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ふのかずは ほすうでかく
text: 負の数は 補数で書く

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: にのほすうは びっとはんてんして
text: 2の補数は ビット反転して

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いちをたす それでかんせい
text: 1を足す それで完成

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: まいなすいちは ぜんぶいち
text: −1は 全部1

:::callout {1}
例：5 = 0101 → 反転 1010 → ＋1 → 1011（−5）
:::
:::bullets
- {2} ビットを反転する（0 ↔ 1）
- {3} 1 を足すと、その数の負の数 {!3}
- {4} −1 は 1111（全ビット 1）
:::

## 桁落ち：引き算で有効桁が減る chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ほぼおなじ かずのひきざん
text: ほぼ同じ 数の引き算

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: けたおちだ ゆうこうけたへるよ
text: 桁落ちだ 有効桁減るよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: のこるのは ごさばかり
text: 残るのは 誤差ばかり

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ひきざんに きをつけて
text: 引き算に 気をつけて

:::callout {1}
1.23456 − 1.23455 = 0.00001
:::
:::bullets
- {2} ほぼ等しい数の引き算で、有効桁が減る {!2}
- {3} 残った桁は誤差の影響が大きい
:::

## 情報落ち：小さい数が消える chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おおきいかずに ちいさいかず
text: 大きい数に 小さい数

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: たすとちいさいほうが きえちゃうよ
text: 足すと小さい方が 消えちゃうよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: じょうほうおち ちいさいじゅんに
text: 情報落ち 小さい順に

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: たしてゆけば ふせげるよ
text: 足してゆけば 防げるよ

:::callout {1}
10000000 ＋ 0.0000001 → 10000000
:::
:::bullets
- {2} 大きい数と小さい数の加減算で、小さい方が消える {!2}
- {4} 対策：小さい数から順に足す {!4}
:::

## ド・モルガンの法則：否定は AND と OR を入れ替える chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: えーかつびーの ひていはね
text: AかつBの 否定はね

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: えーでないか びーでないかになる
text: Aでないか Bでないかになる

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かつとまたは いれかえて
text: かつとまたは 入れ替えて

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぜんぶにひていをつける
text: 全部に否定をつける

:::math {1}
\overline{A \cdot B} = \overline{A} + \overline{B}
:::
:::math {3}
\overline{A + B} = \overline{A} \cdot \overline{B}
:::
:::bullets
- {3} AND と OR を入れ替える
- {4} それぞれに NOT を付ける {!4}
:::

## 正規分布：平均を中心にした釣り鐘形 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: つりがねがた へいきんちゅうしん
text: 釣り鐘形 平均中心

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: せいきぶんぷ いちしぐまに
text: 正規分布 ±1σに

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ろくじゅうはちぱーせんと
text: 約68%

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: にしぐまで きゅうじゅうご
text: ±2σで 95%

:::bullets
- {1} 平均を中心にした釣り鐘形の分布
- {3} 平均 ± 1σ に約 68 % {!3}
- {4} 平均 ± 2σ に約 95 % {!4}
- {4} σ（標準偏差）＝ ばらつきの大きさ
:::

## 待ち行列（M/M/1）：混むと待ちが急に伸びる chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: まちぎょうれつ りようりつろー
text: 待ち行列 利用率ρ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ろーわる いちまいなすろー
text: ρ ÷（1−ρ）

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さーびすじかんを かけるのだ
text: サービス時間を 掛けるのだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: こむとまちが きゅうにのびる
text: 混むと待ちが 急に伸びる

:::bullets
- {1} M/M/1：窓口が 1 つの待ち行列
- {1} 利用率 ρ ＝ 到着率 × 平均サービス時間
- {4} ρ が 1 に近づくと、待ち時間が急に伸びる {!4}
:::
:::math {2}
\text{平均待ち時間} = \frac{\rho}{1-\rho} \times \text{平均サービス時間}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- 2 の補数：負の数の表し方
- 桁落ち：引き算で有効桁が減る
- 情報落ち：小さい数が消える
- ド・モルガンの法則：否定は AND と OR を入れ替える
- 正規分布：平均を中心にした釣り鐘形
- 待ち行列（M/M/1）：混むと待ちが急に伸びる
:::
