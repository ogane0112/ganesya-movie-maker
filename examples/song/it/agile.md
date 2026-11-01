---
title: 天国と地獄で覚えるIT用語 開発手法編
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
 1 本 1 テーマ（開発手法編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
開発手法編
:::

## ウォーターフォール：順番に一方向で chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: うえからしたへ ながれるように
text: 上から下へ 流れるように

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: うぉーたーふぉーる こうていじゅんに
text: ウォーターフォール 工程順に

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: もどらずに すすめていく
text: 戻らずに 進めていく

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: へんこうには よわいのだ
text: 変更には 弱いのだ

:::callout {2}
要件定義 → 設計 → 実装 → テスト → 運用
:::
:::bullets
- {3} 工程を順番に一方向で進める {!3}
- {4} あとから仕様を変えにくい {!4}
:::

## アジャイル：短く作って見直す chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: みじかくつくり みなおすの
text: 短く作り 見直すの

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あじゃいるは くりかえしてそだてる
text: アジャイルは 繰り返して育てる

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: へんかにつよい かいはつだ
text: 変化に強い 開発だ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: すくらむや えっくすぴーだよ
text: スクラムや XP だよ

:::bullets
- {1} 短い期間で作って見直すを繰り返す {!2}
- {3} 仕様の変化に強い
- {4} 代表的な手法：スクラム・XP（エクストリームプログラミング）
:::

## スクラム：役割とバックログ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すくらむの やくわりみっつ
text: スクラムの 役割3つ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: おーなーと すくらむますたー
text: オーナーと スクラムマスター

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かいはつしゃ ばっくろぐで
text: 開発者 バックログで

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ゆうせんじゅんに すすめるの
text: 優先順に 進めるの

:::bullets
- {1} 役割：プロダクトオーナー・スクラムマスター・開発者 {!2}
- {3} プロダクトバックログ：作るものの優先順位付き一覧
- {4} 優先順位の高いものから作る {!4}
:::

## スプリント：1 か月以内のくぎり chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いっかげつ いないのくぎり
text: 1か月 以内の区切り

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: すぷりんとだよ まいにちじゅうごふん
text: スプリントだよ 毎日15分

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でいりーすくらむ さいごには
text: デイリースクラム 最後には

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: れびゅーと ふりかえりだ
text: レビューと 振り返りだ

:::bullets
- {1} スプリント：1 か月以内の開発期間 {!1}
- {2} デイリースクラム：毎日 15 分の短い打合せ
- {4} スプリントレビュー：成果物の確認
- {4} レトロスペクティブ：進め方の振り返り {!4}
:::

## テスト駆動開発（TDD） chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: てすとをさきに かいてから
text: テストを先に 書いてから

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: こーどをかくのが てぃーでぃーでぃー
text: コードを書くのが TDD

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: とおったら なかをきれいに
text: 通ったら 中をきれいに

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: りふぁくたりんぐ するのだ
text: リファクタリング するのだ

:::diagram direction=TB
- {1} テストを書く（まだ失敗）
->
- {2} コードを書く（テスト成功）
->
- {3} リファクタリング {!4}
:::

## CI/CD と DevOps chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: こまめにとうごう じどうてすと
text: こまめに統合 自動テスト

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: しーあいで びるどとてすとをまわす
text: CIで ビルドとテストを回す

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でぶおぷすは かいはつうんよう
text: DevOpsは 開発運用

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: きょうりょくして じどうかだ
text: 協力して 自動化だ

:::bullets
- {1} CI：こまめに統合して、自動でビルド・テスト {!2}
- {3} DevOps：開発と運用が協力する
- {4} CI/CD：本番への反映（デプロイ）まで自動化 {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ウォーターフォール：順番に一方向で
- アジャイル：短く作って見直す
- スクラム：役割とバックログ
- スプリント：1 か月以内のくぎり
- テスト駆動開発（TDD）
- CI/CD と DevOps
:::
