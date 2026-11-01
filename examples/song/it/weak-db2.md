---
title: 天国と地獄で覚えるIT用語 苦手克服 データベース②（同時実行）編
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
 1 本 1 テーマ（苦手克服 データベース②（同時実行）編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
苦手克服 データベース②（同時実行）編
:::

## ダーティリード：未コミットを読む chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: まだこみっとしてない でーたをよむ
text: まだコミットしてない データを読む

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: だーてぃーりーど よごれたよみこみ
text: ダーティリード 汚れた読み込み

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: とりけされたら
text: 取り消されたら

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ないでーたを よんでいた
text: ないデータを 読んでいた

:::bullets
- {1} 他のトランザクションの、未コミットのデータを読んでしまう {!2}
- {3} 相手が取り消すと、存在しないデータを読んだことになる
:::

## ノンリピータブルリード：2 回読むと値が違う chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おなじぎょうを にかいよむと
text: 同じ行を 2回読むと

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あいだにこうしん あたいがかわる
text: 間に更新 値が変わる

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: のんりぴーたぶる
text: ノンリピータブル

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: くりかえしよめない りーどだよ
text: 繰り返し読めない リードだよ

:::bullets
- {1} 同じ行を 2 回読むと
- {2} 間に他が更新して、値が変わっている {!2}
:::

## ファントムリード：行数が変わる chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おなじじょうけんで にかいけんさく
text: 同じ条件で 2回検索

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あいだにそうにゅう ぎょうがふえる
text: 間に挿入 行が増える

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: まぼろしのぎょう
text: 幻の行

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ふぁんとむりーど なのだよ
text: ファントムリード なのだよ

:::bullets
- {1} 同じ条件で 2 回検索すると
- {2} 間に他が挿入・削除して、行数が変わっている {!2}
- {3} 値が変わる（ノンリピータブル）と区別：こちらは行が増減する
:::

## 分離レベル：上ほど緩い chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぶんりれべるは よっつあるよ
text: 分離レベルは 4つあるよ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あんこみってっどは ぜんぶおきる
text: UNCOMMITTEDは 全部起きる

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しりあらいざぶる
text: SERIALIZABLE

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぜんぶふせぐが おそくなる
text: 全部防ぐが 遅くなる

:::bullets
- {2} READ UNCOMMITTED：3 つとも起きる
- {2} READ COMMITTED：ダーティリードを防ぐ
- {3} REPEATABLE READ：ファントムリードだけ起きる
- {4} SERIALIZABLE：3 つとも防ぐ（いちばん遅い） {!4}
:::

## 悲観的排他制御と楽観的排他制御 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: きっとぶつかる さきにろっく
text: きっとぶつかる 先にロック

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ひかんてきは まえもってふせぐ
text: 悲観的は 前もって防ぐ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: らっかんてきは ろっくせず
text: 楽観的は ロックせず

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: こみっとじに ばーじょんくらべる
text: コミット時に バージョン比べる

:::bullets
- {1} 悲観的：更新の前にロックを取り、競合を防ぐ {!2}
- {3} 楽観的：ロックせずに進め、コミット時にバージョンやタイムスタンプで競合を検出 {!4}
:::

## MVCC：古い版を残して待たずに読む chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ふるいばんを のこしておいて
text: 古い版を 残しておいて

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: よむひとは ろっくをまたない
text: 読む人は ロックを待たない

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: えむぶいしーしー
text: MVCC

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: たはんがた どうじじっこうせいぎょ
text: 多版型 同時実行制御

:::bullets
- {1} 更新前の古い版を残す
- {2} 読む側はロックを待たずに、整合した版を読める {!2}
- {3} MVCC：多版型同時実行制御（Multi-Version ＝ 版を複数持つ） {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ダーティリード：未コミットを読む
- ノンリピータブルリード：2 回読むと値が違う
- ファントムリード：行数が変わる
- 分離レベル：上ほど緩い
- 悲観的排他制御と楽観的排他制御
- MVCC：古い版を残して待たずに読む
:::
