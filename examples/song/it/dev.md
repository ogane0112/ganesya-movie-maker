---
title: 天国と地獄で覚えるIT用語 開発技術編
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
 1 本 1 テーマ（開発技術編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
開発技術編
:::

## ホワイトボックスとブラックボックス chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なかみをみる ほわいとぼっくす
text: 中身を見る ホワイトボックス

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ろじっくの みちをためす
text: ロジックの 道を試す

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぶらっくぼっくす なかはみない
text: ブラックボックス 中は見ない

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: にゅうしゅつりょくだけ たしかめる
text: 入出力だけ 確かめる

:::bullets
- {1} ホワイトボックス：内部のロジックを見てテスト {!1}
- {2} 命令網羅・条件網羅など
- {3} ブラックボックス：入力と出力だけを見る {!3}
- {4} 同値分割・境界値分析など
:::

## 同値分割と境界値分析 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おなじあつかいの なかまからは
text: 同じ扱いの 仲間からは

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: だいひょうちで どうちぶんかつ
text: 代表値で 同値分割

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: はんいのはしと そのそとを
text: 範囲の端と その外を

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: きょうかいちぶんせき
text: 境界値分析

:::callout {1}
例：18〜64 歳が有効な入力
:::
:::bullets
- {2} 同値分割：グループごとに代表値で試す（例：30 歳） {!2}
- {3} 境界値分析：範囲の端とその外側を試す
- {4} 例：17・18・64・65 歳 {!4}
:::

## モジュール強度と結合度 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: もじゅーるの なかはつよく
text: モジュールの 中は強く

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ぎょうしゅうどは たかいほどよい
text: 凝集度は 高いほど良い

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいだは よわくつなぐ
text: 間は 弱くつなぐ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: けつごうどは ひくいほどよい
text: 結合度は 低いほど良い

:::bullets
- {1} モジュール強度（凝集度）：中のまとまり
- {2} 強いほど良い（機能的強度が最良） {!2}
- {3} 結合度：モジュール同士のつながり
- {4} 弱いほど良い（データ結合が最良） {!4}
:::

## オブジェクト指向：カプセル化・継承・多相性 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かぷせるかで なかみをかくす
text: カプセル化で 中身を隠す

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: けいしょうで おやをひきつぐ
text: 継承で 親を引き継ぐ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: たそうせいは おなじめいれい
text: 多相性は 同じ命令

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ちがううごき するのだよ
text: 違う動き するのだよ

:::bullets
- {1} カプセル化：データと処理をまとめ、中身を隠す {!1}
- {2} 継承：親クラスの性質を子クラスが引き継ぐ {!2}
- {3} 多相性（ポリモーフィズム）：同じ命令で違う動きをする {!4}
:::

## スタブとドライバ：部品の代役 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: まだないぶひんの かわりやく
text: まだない部品の 代わり役

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: したのかわりは すたぶだよ
text: 下の代わりは スタブだよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: うえのかわりは どらいばだ
text: 上の代わりは ドライバだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: けつごうてすとで つかうのだ
text: 結合テストで 使うのだ

:::diagram direction=TB
- {3} ドライバ（上位の代役）
-> {3} 呼び出す
- {1} テストする部品 {!1}
-> {2} 呼び出す
- {2} スタブ（下位の代役）
:::

## 回帰テスト：直したらほかも確かめる chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なおしたら ほかがこわれて
text: 直したら ほかが壊れて

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: いないかたしかめる かいきてすと
text: いないか確かめる 回帰テスト

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: まえのてすとを もういちど
text: 前のテストを もう一度

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: じどうかすれば らくなのだ
text: 自動化すれば 楽なのだ

:::bullets
- {1} 修正や機能追加のあとに
- {2} ほかの所が壊れていないか確かめる {!2}
- {3} 前に行ったテストをもう一度行う
- {4} 自動化すると繰り返しが楽（CI と相性がよい）
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ホワイトボックスとブラックボックス
- 同値分割と境界値分析
- モジュール強度と結合度
- オブジェクト指向：カプセル化・継承・多相性
- スタブとドライバ：部品の代役
- 回帰テスト：直したらほかも確かめる
:::
