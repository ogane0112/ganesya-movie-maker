---
title: 天国と地獄で覚えるIT用語 苦手克服 データベース③（構造と分散）編
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
 1 本 1 テーマ（苦手克服 データベース③（構造と分散）編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
苦手克服 データベース③（構造と分散）編
:::

## ビュー：実データを持たない仮想表 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: じつでーたもたない かそうのひょう
text: 実データ持たない 仮想の表

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: びゅーはまどから みているだけ
text: ビューは窓から 見ているだけ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さんしょうのたびに せれくとじっこう
text: 参照のたびに SELECT実行

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: しゅうけいのびゅーは こうしんふか
text: 集計のビューは 更新不可

:::bullets
- {1} 実データを持たない仮想表（窓から見ているだけ） {!1}
- {3} 参照のたびに、定義した SELECT 文が実行される
- {4} 集約関数・GROUP BY・DISTINCT を含むビューは更新できない {!4}
:::

## トリガーとストアドプロシージャ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いべんとで じどうでうごく
text: イベントで 自動で動く

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: とりがーは ひきがねなのだ
text: トリガーは 引き金なのだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すとあどぷろしーじゃ よびだすの
text: ストアドプロシージャ 呼び出すの

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: つうしんかいすう へらせるの
text: 通信回数 減らせるの

:::bullets
- {1} トリガー：INSERT・UPDATE・DELETE などで自動で実行（trigger ＝ 引き金） {!2}
- {3} ストアドプロシージャ：DB に登録した処理を呼び出して実行 {!3}
- {4} 通信回数が減る
:::

## CAP 定理と BASE chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いっかんせい かようせいと
text: 一貫性 可用性と

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ぶんだんたいせい みっつはむりで
text: 分断耐性 3つは無理で

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ふたつまでだよ きゃっぷていり
text: 2つまでだよ CAP定理

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: べーすは あとでそろえばいい
text: BASEは 後でそろえばいい

:::bullets
- {1} 一貫性（C）・可用性（A）・分断耐性（P）
- {3} CAP 定理：同時に満たせるのは 2 つまで {!3}
- {4} BASE：可用性を優先し、時間がたてば整合すればよい（結果整合性） {!4}
:::

## シャーディングとレプリケーション chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ひとつのひょうを ぎょうでわけて
text: 1つの表を 行で分けて

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: さーばにくばる しゃーでぃんぐ
text: サーバに配る シャーディング

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おなじふくせい ほかにもつ
text: 同じ複製 ほかに持つ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: れぷりけーしょん ふくせいだよ
text: レプリケーション 複製だよ

:::bullets
- {1} シャーディング：1 つの表を行単位で複数のサーバに分けて負荷分散（shard ＝ かけら） {!2}
- {3} レプリケーション：同じデータの複製を別のサーバに持つ（replica ＝ 複製） {!4}
:::

## 部分関数従属：第 2 正規形ではない chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しゅきーのいちぶで きまるれつ
text: 主キーの一部で 決まる列

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ぶぶんかんすうじゅうぞく あるならば
text: 部分関数従属 あるならば

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: だいにせいきけいでは ないのだよ
text: 第2正規形では ないのだよ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: べつのひょうに わけるのだ
text: 別の表に 分けるのだ

:::callout {1}
受注明細の主キー ＝ {受注番号, 商品コード}
:::
:::bullets
- {2} 商品コードだけで商品名・単価が決まる（部分関数従属） {!2}
- {3} だから第 2 正規形ではない
- {4} 商品の表を別に分ける {!4}
:::

## 3 層スキーマ：外・真ん中・内 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: がいぶすきーまは りようしゃのみかた
text: 外部スキーマは 利用者の見方

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: がいねんすきーま ぜんたいせっけい
text: 概念スキーマ 全体設計

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ないぶすきーまは
text: 内部スキーマは

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: でぃすくのなかの かくのうほうほう
text: ディスクの中の 格納方法

:::diagram direction=TB
- {1} 外部スキーマ（利用者から見た形・ビュー）
--
- {2} 概念スキーマ（DB 全体の論理的な設計） {!2}
--
- {3} 内部スキーマ（ファイル構造・格納方法）
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ビュー：実データを持たない仮想表
- トリガーとストアドプロシージャ
- CAP 定理と BASE
- シャーディングとレプリケーション
- 部分関数従属：第 2 正規形ではない
- 3 層スキーマ：外・真ん中・内
:::
