---
title: 天国と地獄で覚える応用情報 セキュリティ編
layout: song
bpm: 120
music: pop
singer: zundamon
transpose: 3             # ハ長調 → 変ホ長調。歌いやすい高さに
character: builtin
theme: pop
---

<!--
 メロディ：オッフェンバック「天国と地獄」（地獄のギャロップ／カンカン。1858 年・パブリックドメイン）の主題。
 1 升 = 16 分音符（grid=16）。原曲の 2/4 拍子の 2 小節を 1 小節にまとめている。
 1 本 1 テーマ（セキュリティ編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚える応用情報 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚える応用情報
セキュリティ編
:::

## 共通鍵暗号：同じ鍵で閉じて開ける chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おなじかぎ とじてあける
text: 同じ鍵 閉じて開ける

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: きょうつうかぎ あんごうはやいよ
text: 共通鍵 暗号速いよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でもかぎを どうわたすの
text: でも鍵を どう渡すの

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かぎはいそうもんだいだ
text: 鍵配送問題だ

:::diagram
- {1} 送る人
-> {1} 同じ鍵で暗号化・復号
- {1} 受け手
:::
:::bullets
- {2} 処理が速い（AES など） {!2}
- {3} 鍵を相手に安全に渡すのが難しい（鍵配送問題） {!4}
:::

## 公開鍵暗号：鍵は 2 つ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かぎふたつ こうかいかぎ
text: 鍵二つ 公開鍵

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あんごうかは あいてのかぎでね
text: 暗号化は 相手の鍵でね

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ふくごうは ひみつのかぎ
text: 復号は 秘密の鍵

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: じぶんだけが もってるよ
text: 自分だけが 持ってるよ

:::diagram direction=TB
- {1} 送る人
-> {2} 受け手の公開鍵で暗号化
- {2} 暗号文
-> {3} 受け手の秘密鍵で復号
- {3} 受け手 {!4}
:::

## デジタル署名：本人のしるし chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ひみつかぎで しょめいする
text: 秘密鍵で 署名する

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: でじたるしょめい ほんにんあかし
text: デジタル署名 本人の証

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: こうかいかぎで けんしょう
text: 公開鍵で 検証

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かいざんも みつけられる
text: 改ざんも 見つけられる

:::diagram direction=TB
- {1} 送る人
-> {1} 送る人の秘密鍵で署名
- {2} 署名つきの文書
-> {3} 送る人の公開鍵で検証
- {3} 受け手 {!4}
:::

## ハッシュ：元に戻せない要約 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: はっしゅちは もどせないの
text: ハッシュ値は 戻せないの

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: いちもじでも ぜんぜんちがうち
text: 一文字でも 全然違う値

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぱすわーど ほぞんにもね
text: パスワード 保存にもね

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かいざん すぐにみつかる
text: 改ざん すぐに見つかる

:::diagram
- {1} データ
-> {1} ハッシュ関数
- {1} ハッシュ値（固定長） {!1}
:::
:::bullets
- {1} 元のデータには戻せない（一方向性）
- {2} 1 文字違うだけで全く別の値
- {3} パスワードはハッシュ値で保存
- {4} 値を比べて改ざんを検知 {!4}
:::

## ファイアウォール：外と中の境目 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: そととなかの さかいめに
text: 外と中の 境目に

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ふぁいあうぉーる かべをたてておく
text: ファイアウォール 壁を立てておく

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ゆるしたもの だけとおす
text: 許したものだけ 通す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぽーとやあいぴーでみる
text: ポートや IPで見る

:::diagram direction=TB
- {1} インターネット
-> {3} 許可した通信だけ通す
- {2} ファイアウォール {!2}
-> {4} IP アドレス・ポート番号で判断
- {1} 社内ネットワーク
:::

## SQL インジェクション：入力に命令を混ぜる攻撃 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: にゅうりょくに えすきゅーえる
text: 入力に SQL

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: まぜてだます いんじぇくしょんなの
text: 混ぜて騙す インジェクションなの

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: たいさくは えすけーぷと
text: 対策は エスケープと

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぷれーすほるだをつかう
text: プレースホルダを使う

:::code lang=sql {1} highlight="{2}:1 {4}:2"
SELECT * FROM 会員 WHERE id = '' OR '1'='1';
SELECT * FROM 会員 WHERE id = ?;
:::
:::bullets
- {2} 入力に SQL を混ぜて、意図しない命令を実行させる {!2}
- {3} 対策：エスケープ処理
- {4} 対策：プレースホルダ（入力を値としてだけ扱う） {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- 共通鍵暗号：同じ鍵で閉じて開ける
- 公開鍵暗号：鍵は 2 つ
- デジタル署名：本人のしるし
- ハッシュ：元に戻せない要約
- ファイアウォール：外と中の境目
- SQL インジェクション：入力に命令を混ぜる攻撃
:::
