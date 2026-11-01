---
title: 天国と地獄で覚えるIT用語 苦手克服 開発編
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
 1 本 1 テーマ（苦手克服 開発編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
苦手克服 開発編
:::

## ユースケース図とクラス図 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ひとがたとだえんで
text: 人型と楕円で

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ゆーすけーすず あくたーときのう
text: ユースケース図 アクターと機能

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: くらすずは ぞくせいそうさ
text: クラス図は 属性操作

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かんけいかく せっけいのほね
text: 関係描く 設計の骨

:::bullets
- {1} ユースケース図：利用者（アクター）とシステムの機能（人型と楕円） {!2}
- {3} クラス図：クラスの属性・操作と関係（設計図の骨組み） {!4}
:::

## シーケンス図とアクティビティ図 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: じかんのじゅんに やりとりかく
text: 時間の順に やり取り描く

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: しーけんすずだ じゅんばんだよ
text: シーケンス図だ 順番だよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しょりのながれは
text: 処理の流れは

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: あくてぃびてぃず ふろーちゃーと
text: アクティビティ図 フローチャート

:::bullets
- {1} シーケンス図：オブジェクト間のやり取りを時系列で（sequence ＝ 順番） {!2}
- {3} アクティビティ図：処理の流れ（フローチャートのよう） {!4}
:::

## ステートマシン図：状態とイベント chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: じょうたいと いべんとで
text: 状態と イベントで

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: かわるようすを すてーとましんず
text: 変わる様子を ステートマシン図

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すてーとは じょうたいのこと
text: ステートは 状態のこと

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: しんごうきなら あかあおきいろ
text: 信号機なら 赤青黄色

:::bullets
- {1} ステートマシン図：状態とイベントによる変化 {!2}
- {3} state ＝ 状態
- {4} 例：信号機（青 → 黄 → 赤）
:::

## ウォークスルーとインスペクション chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さくせいしゃが せつめいして
text: 作成者が 説明して

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: すすめるのが うぉーくするーだ
text: 進めるのが ウォークスルーだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: もでれーたが しきるのは
text: モデレータが 仕切るのは

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: こうしきな いんすぺくしょん
text: 公式な インスペクション

:::bullets
- {1} ウォークスルー：作成者が説明しながら進める {!2}
- {3} インスペクション：モデレータが主導する公式なレビュー {!4}
- {4} ラウンドロビン：参加者が持ち回りで進行
:::

## スクラムのイベント：レビューとレトロ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すぷりんとの はじめにけいかく
text: スプリントの 初めに計画

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: まいにちでいりー さいごにれびゅーと
text: 毎日デイリー 最後にレビューと

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: れとろすぺくてぃぶ
text: レトロスペクティブ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: なにをつくったか どうすすめたか
text: 何を作ったか どう進めたか

:::callout {1}
プランニング → デイリースクラム（毎日）→ スプリントレビュー → レトロスペクティブ
:::
:::bullets
- {4} スプリントレビュー：何を作ったか（成果物の確認） {!4}
- {4} レトロスペクティブ：どう進めたか（進め方の振り返り） {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ユースケース図とクラス図
- シーケンス図とアクティビティ図
- ステートマシン図：状態とイベント
- ウォークスルーとインスペクション
- スクラムのイベント：レビューとレトロ
:::
