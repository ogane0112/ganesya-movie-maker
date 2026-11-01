---
title: 天国と地獄で覚えるIT用語 OS 編
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
 1 本 1 テーマ（OS 編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
OS 編
:::

## プロセスとスレッド chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: うごいている ぷろぐらむは
text: 動いている プログラムは

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ぷろせすだよ なかのしょりは
text: プロセスだよ 中の処理は

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すれっどで めもりきょうゆう
text: スレッドで メモリ共有

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かるいから はやくきりかわる
text: 軽いから 速く切り替わる

:::bullets
- {2} プロセス：実行中のプログラム（メモリは別々） {!2}
- {3} スレッド：プロセスの中の処理の単位（メモリを共有） {!3}
- {4} スレッドは切り替えが軽い
:::

## スケジューリング：順番の決め方 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: じゅんばんに じかんをきって
text: 順番に 時間を切って

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: らうんどろびん みんなでこうたい
text: ラウンドロビン みんなで交代

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: とうちゃくじゅん ゆうせんどじゅん
text: 到着順 優先度順

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: しょりじかんじゅんもある
text: 処理時間順もある

:::bullets
- {2} ラウンドロビン：一定時間ずつ順番に実行して交代 {!2}
- {3} 到着順・優先度順
- {4} 処理時間順（短いものから）
:::

## 仮想記憶とページング chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ほじょきおくで おおきくみせる
text: 補助記憶で 大きく見せる

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: かそうきおく ぺーじでわけるよ
text: 仮想記憶 ページで分けるよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ないぺーじは ぺーじふぉると
text: ないページは ページフォールト

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: でぃすくから よみこむの
text: ディスクから 読み込むの

:::diagram
- {1} 主記憶
<-> {2} ページ単位で入れ替え
- {1} 補助記憶（ディスク） {!2}
:::
:::bullets
- {2} ページング：固定長（ページ）で分ける
- {3} 必要なページが主記憶にない ＝ ページフォールト {!3}
:::

## ページ置換え：LRU と FIFO chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おいだすぺーじ どれにする
text: 追い出すページ どれにする

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: えるあーるゆーは いちばんむかし
text: LRUは 一番昔

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: つかったのを おいだすよ
text: 使ったのを 追い出すよ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ふぁいふぉは いれたじゅんだ
text: FIFOは 入れた順だ

:::bullets
- {2} LRU：最後に使ってから最も時間がたったページを追い出す {!2}
- {4} FIFO：最初に入れたページから追い出す
- {4} LFU：使った回数が最も少ないページを追い出す
:::

## スラッシング：出し入ればかりで遅い chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: めもりが たりなくなると
text: メモリが 足りなくなると

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ぺーじのでいりばかり ふえるのだ
text: ページの出入りばかり 増えるのだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: すらっしんぐ おそくなる
text: スラッシング 遅くなる

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: めもりをふやして かいけつだ
text: メモリを増やして 解決だ

:::bullets
- {1} 主記憶が足りないとき
- {2} ページの出し入ればかりで処理が進まない {!3}
- {4} 対策：主記憶を増やす・同時に動かすプログラムを減らす
:::

## セマフォ：共有資源を同時に使わせない chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: きょうゆうしげんを まもるのは
text: 共有資源を 守るのは

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: せまふぉだよ かずでかんりする
text: セマフォだよ 数で管理する

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぴーでへらし ぶいでふやす
text: Pで減らし Vで増やす

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぜろならじゅんばんまち
text: 0なら順番待ち

:::bullets
- {1} 排他制御：共有資源を同時に使わせない
- {2} セマフォ：使える数を表す変数 {!2}
- {3} P 操作で 1 減らす ／ V 操作で 1 増やす
- {4} 0 なら空くまで待つ {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- プロセスとスレッド
- スケジューリング：順番の決め方
- 仮想記憶とページング
- ページ置換え：LRU と FIFO
- スラッシング：出し入ればかりで遅い
- セマフォ：共有資源を同時に使わせない
:::
