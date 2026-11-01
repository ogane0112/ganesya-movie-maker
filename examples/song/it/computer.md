---
title: 天国と地獄で覚えるIT用語 コンピュータ構成編
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
 1 本 1 テーマ（コンピュータ構成編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
コンピュータ構成編
:::

## キャッシュメモリ：速度差を埋める chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しーぴーゆーと しゅきおくの
text: CPUと 主記憶の

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: そくどのさを うめるきゃっしゅめもり
text: 速度の差を 埋めるキャッシュメモリ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: よくつかう でーたをおく
text: よく使う データを置く

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ひっとりつで はやさきまる
text: ヒット率で 速さ決まる

:::diagram
- {1} CPU
<->
- {2} キャッシュ {!2}
<->
- {1} 主記憶
:::
:::callout {4}
実効アクセス時間 ＝ ヒット率 × キャッシュ ＋（1 − ヒット率）× 主記憶
:::

## ライトスルーとライトバック：書き込みのタイミング chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かきこみかた ふたつあるの
text: 書き込み方 2つあるの

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: らいとするーは しゅきおくにもかく
text: ライトスルーは 主記憶にも書く

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: らいとばっくは おいだすとき
text: ライトバックは 追い出すとき

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: まとめてかくから はやいのだ
text: まとめて書くから 速いのだ

:::bullets
- {2} ライトスルー：キャッシュと主記憶に同時に書く（内容が常に一致） {!2}
- {3} ライトバック：キャッシュから追い出すときに主記憶へ書く {!3}
- {4} ライトバックは書き込みが速い（そのぶん制御が複雑）
:::

## パイプライン：命令の段階をずらして重ねる chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: めいれいの だんかいずらし
text: 命令の 段階ずらし

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: かさねてすすめる ぱいぷらいんだ
text: 重ねて進める パイプラインだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぶんきすると やりなおしだ
text: 分岐すると やり直しだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぶんきよそくで そなえるよ
text: 分岐予測で 備えるよ

:::code lang=text {1}
命令1  取出 解読 実行 書込
命令2       取出 解読 実行 書込
命令3            取出 解読 実行 書込
:::
:::bullets
- {3} 分岐命令で流れが乱れる（ハザード）
- {4} 対策：分岐予測・投機実行 {!4}
:::

## RISC と CISC：単純な命令か、複雑な命令か chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: りすくは たんじゅんめいれい
text: RISCは 単純命令

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: こていちょうで ぱいぷらいんむき
text: 固定長で パイプライン向き

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しすくは ふくざつめいれい
text: CISCは 複雑命令

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かへんちょうで いろいろできる
text: 可変長で いろいろできる

:::bullets
- {1} RISC：単純な命令 {!1}
- {2} 固定長で、パイプラインに向く
- {3} CISC：複雑な命令 {!3}
- {4} 可変長で、1 命令で多くの処理をする
:::

## MIPS：1 秒間の命令数（百万単位） chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いちびょうかんに なんめいれい
text: 1秒間に 何命令

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: みっぷすのたんいは ひゃくまんだよ
text: MIPSの単位は 百万だよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: くろっくを しーぴーあいで
text: クロックを CPIで

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: わればもとまる めいれいすう
text: 割れば求まる 命令数

:::callout {1}
MIPS ＝ 1 秒間に実行できる命令の数（百万単位）
:::
:::math {3}
\text{MIPS} = \frac{\text{クロック周波数}}{\text{CPI} \times 10^6}
:::
:::bullets
- {3} CPI：1 命令あたりのクロック数
:::

## DMA：CPU を通さずに直接転送 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しーぴーゆーを とおさずに
text: CPUを 通さずに

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: そうちとめもりが ちょくせつてんそう
text: 装置とメモリが 直接転送

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でぃーえむえー そのあいだ
text: DMA その間

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: しーぴーゆーは べつのしごと
text: CPUは 別の仕事

:::diagram
- {2} 入出力装置
<-> {2} 直接転送
- {2} メモリ {!3}
:::
:::bullets
- {1} CPU を通さずに、装置とメモリが直接データを転送
- {4} その間、CPU は別の処理ができる {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- キャッシュメモリ：速度差を埋める
- ライトスルーとライトバック：書き込みのタイミング
- パイプライン：命令の段階をずらして重ねる
- RISC と CISC：単純な命令か、複雑な命令か
- MIPS：1 秒間の命令数（百万単位）
- DMA：CPU を通さずに直接転送
:::
