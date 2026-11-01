---
title: 天国と地獄で覚える応用情報
layout: song
bpm: 120
music: pop
singer: zundamon
transpose: 3             # ハ長調 → 変ホ長調。歌いやすい高さに
character: builtin       # 歌う人（右に立つ）。自分の立ち絵なら characters/<名前>/
theme: pop
---

<!--
 メロディ：オッフェンバック「天国と地獄」（地獄のギャロップ／カンカン。1858 年・パブリックドメイン）の主題。
 1 升 = 16 分音符（grid=16）。原曲の 2/4 拍子の 2 小節を 1 小節にまとめている。
 用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る（{n} は n 番目のフレーズ）。
 1 番＝ネットワーク（DNS・DHCP）、2 番＝データベース（正規化・ACID）、3 番＝セキュリティ（公開鍵暗号・ハッシュ）
-->

## 天国と地獄で覚える応用情報 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚える応用情報
ネットワーク・データベース・セキュリティ
:::

## DNS：名前を IP アドレスに chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なまえから あいぴーひく
text: 名前から IP引く

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: でぃーえぬえす なまえかいけつだ
text: DNS 名前解決だ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぶらうざが さーばにきく
text: ブラウザが サーバに聞く

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ばんごうが かえってくる
text: 番号が 返ってくる

:::callout {1}
ドメイン名 → IP アドレス に変換（名前解決）
:::
:::diagram
- {3} ブラウザ
-> {3} www.example.jp は？
- {2} DNSサーバ {!2}
:::
:::text {4}
答え：192.0.2.1（この IP アドレスに接続する）
:::

## DHCP：IP アドレスを自動で配る chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいぴーを じどうでかす
text: IPを 自動で貸す

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: でぃーえいちしーぴーさーばだよ
text: DHCPサーバだよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: げーとうぇい ますくもかす
text: ゲートウェイ マスクも貸す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: きげんつきの りーすだよ
text: 期限付きの リースだよ

:::diagram
- {1} PC
<- {1} 設定を貸し出す
- {2} DHCPサーバ {!2}
:::
:::bullets
- {3} IP アドレス・サブネットマスク
- {3} デフォルトゲートウェイ・DNS サーバ
- {4} 期限付きで貸す（リース） {!4}
:::

## 正規化：重複をなくす chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: せいきかは むだをへらす
text: 正規化は ムダを減らす

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: おなじでーた いっかいだけかく
text: 同じデータ 一回だけ書く

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ひょうをわけ むじゅんをけす
text: 表を分け 矛盾を消す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: だいさんまで すすめよう
text: 第3まで 進めよう

:::diagram
- {2} 注文表（全部入り）
-> {3} 分ける
- {3} 注文・顧客・商品 {!3}
:::
:::bullets
- {2} 同じデータは 1 か所だけに書く
- {3} 更新したのに古い値が残る矛盾を防ぐ
- {4} 第 1 → 第 2 → 第 3 正規形の順に進める {!4}
:::

## ACID：トランザクションの 4 つの性質 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あしっどは しょりのきまり
text: ACIDは 処理の決まり

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: げんしせいは ぜんぶかぜろかだ
text: 原子性は 全部かゼロかだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: むじゅんなし どくりつせい
text: 矛盾なし 独立性

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: えいぞくせい きえないよ
text: 永続性 消えないよ

:::bullets
- {2} A 原子性：全部やるか、全部やらないか {!2}
- {3} C 一貫性：データに矛盾が出ない
- {3} I 独立性：同時に動いても干渉しない
- {4} D 永続性：確定したら消えない {!4}
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

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- DNS：名前 → IP アドレス ／ DHCP：IP を自動で貸す
- 正規化：重複をなくす ／ ACID：A・C・I・D の 4 性質
- 公開鍵暗号：相手の公開鍵で暗号化 ／ ハッシュ：戻せない
:::
