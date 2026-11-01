---
title: 天国と地獄で覚えるIT用語 苦手克服 データベース①（障害回復）編
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
 1 本 1 テーマ（苦手克服 データベース①（障害回復）編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
苦手克服 データベース①（障害回復）編
:::

## ロールバック：更新前ログで取り消す chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いじょうしゅうりょう とちゅうのしょり
text: 異常終了 途中の処理

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ろーるばっくで こうしんまえのろぐ
text: ロールバックで 更新前のログ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: つかってもとに もどすのだ
text: 使って元に 戻すのだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ばっくはもどる おぼえよう
text: バックは戻る 覚えよう

:::bullets
- {1} 異常終了したトランザクションを
- {2} 更新前ログで取り消す {!2}
:::
:::callout {4}
覚え方：back ＝ 戻る
:::

## ロールフォワード：更新後ログでやり直す chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でぃすくこわれた ばっくあっぷを
text: ディスク壊れた バックアップを

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: もどしてから こうしんごのろぐで
text: 戻してから 更新後のログで

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: やりなおすのが ろーるふぉわーど
text: やり直すのが ロールフォワード

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ふぉわーどは すすめる
text: フォワードは 進める

:::bullets
- {1} 媒体障害（ディスクの故障）のとき
- {2} バックアップを戻し、更新後ログでやり直す {!3}
:::
:::callout {4}
覚え方：forward ＝ 進める ／ 取り消しは更新前ログ、やり直しは更新後ログ
:::

## チェックポイント：回復の出発点 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しゅきおくを でぃすくにかく
text: 主記憶を ディスクに書く

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: そのじてんが ちぇっくぽいんと
text: その時点が チェックポイント

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ここからあとだけ しょりすれば
text: ここから後だけ 処理すれば

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かいふくはやく おわるのだ
text: 回復早く 終わるのだ

:::bullets
- {1} 主記憶の内容をディスクに書き出す時点 {!2}
- {3} 回復はここから後だけ処理すればよい（回復の出発点） {!3}
:::

## 2 相コミット：全員 OK なら確定 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぶんさんでーびーで ぜんぶのさいと
text: 分散DBで 全部のサイト

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: じゅんびおーけー きいてかくてい
text: 準備OK 聞いて確定

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ひとつでもだめなら
text: 1つでもダメなら

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぜんぶろーるばっく にそうこみっと
text: 全部ロールバック 2相コミット

:::callout {1}
分散データベースで使う（コミット ＝ 確定）
:::
:::bullets
- {2} 第 1 相：全サイトに準備ができたか確認
- {3} 第 2 相：全部 OK ならコミット、1 つでも NG なら全部ロールバック {!4}
:::

## 2 相ロック：コミットとは別もの chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: にそうでも ろっくはべつだよ
text: 2相でも ロックは別だよ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: かけるだんかいと はずすだんかいを
text: 掛ける段階と 外す段階を

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: わけるのが にそうろっく
text: 分けるのが 2相ロック

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: はいたせいぎょの ほうしきだ
text: 排他制御の 方式だ

:::callout {1}
2 相コミット ＝ 確定の手順 ／ 2 相ロック ＝ 排他制御
:::
:::bullets
- {2} ロックを掛ける段階と外す段階を分ける {!3}
- {4} 排他制御の方式（直列化可能性を保証）
:::

## 共有ロックと専有ロック chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: きょうゆうろっくは よむだけおっけー
text: 共有ロックは 読むだけOK

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: せんゆうは よむのもかくのもだめ
text: 専有は 読むのも書くのもダメ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: せんゆうは ひとりじめ
text: 専有は 独り占め

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: りゅうどこまかく へいこうあっぷ
text: 粒度細かく 並行アップ

:::bullets
- {1} 共有ロック：他人は参照だけ OK
- {2} 専有ロック：他人は参照も更新も NG {!2}
- {3} 覚え方：専有 ＝ 独り占め
- {4} 粒度を小さく → 同時実行性は上がるが、管理の負荷は増える {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ロールバック：更新前ログで取り消す
- ロールフォワード：更新後ログでやり直す
- チェックポイント：回復の出発点
- 2 相コミット：全員 OK なら確定
- 2 相ロック：コミットとは別もの
- 共有ロックと専有ロック
:::
