---
title: 天国と地獄で覚えるIT用語 ネットワーク編
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
 1 本 1 テーマ（ネットワーク編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
ネットワーク編
:::

## IP アドレス：ネットワーク上の住所 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ねっとでの じゅうしょなんだ
text: ネットでの 住所なんだ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あいぴーあどれす よっつのかず
text: IPアドレス 4つの数

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: どのかずも にごごまでだ
text: どの数も 255までだ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぱけっとのあてさきだよ
text: パケットの 宛先だよ

:::callout {2}
192.168.1.10
:::
:::bullets
- {2} 4 つの数を . で区切る（IPv4・32 ビット）
- {3} それぞれ 0 〜 255 {!3}
- {4} データ（パケット）の宛先に使う
:::

## サブネットマスク：どこまでがネットワーク chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: どこまでが ねっとわーく
text: どこまでが ネットワーク

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: さぶねっとで ますくでわけるよ
text: サブネット マスクで分けるよ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: にじゅうよん びっとならば
text: 24 ビットならば

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: あとはほすと ばんごうだ
text: あとは ホスト番号だ

:::bullets
- {1} IP アドレスを「ネットワーク部」と「ホスト部」に分ける
- {3} 255.255.255.0 ＝ /24（先頭 24 ビットがネットワーク部）
:::
:::diagram
- {3} 192.168.1（ネットワーク部） {!3}
--
- {4} .10（ホスト部） {!4}
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

## TCP と UDP：確実か、速いか chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: てぃーしーぴーは かくじつ
text: TCPは 確実

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: とどいたかを たしかめておくる
text: 届いたかを 確かめて送る

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ゆーでぃーぴーは はやいの
text: UDPは 速いの

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: どうがやつうわむきだよ
text: 動画や通話向きだよ

:::bullets
- {1} TCP：届いたか確かめる（信頼性が高い） {!1}
- {2} 届かなければ送り直し、順番もそろえる
- {3} UDP：確かめない分、速い {!3}
- {4} 動画の配信・通話・DNS などに使う
:::

## NAT：IP アドレスを付け替える chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いえのなかの あいぴーを
text: 家の中の IPを

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: なっとがへんかん ぐろーばるへ
text: NATが変換 グローバルへ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぷらいべーと あいぴーは
text: プライベート IPは

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: そとからは みえないんだ
text: 外からは 見えないんだ

:::diagram direction=TB
- {1} PC（プライベート IP：192.168.1.10）
-> {2} 送り元の IP を付け替える
- {2} ルータ（NAT） {!2}
-> {4} 外から中の PC は見えない
- {2} インターネット（グローバル IP）
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- IP アドレス：ネットワーク上の住所
- サブネットマスク：どこまでがネットワーク
- DNS：名前を IP アドレスに
- DHCP：IP アドレスを自動で配る
- TCP と UDP：確実か、速いか
- NAT：IP アドレスを付け替える
:::
