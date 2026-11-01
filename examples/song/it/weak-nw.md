---
title: 天国と地獄で覚えるIT用語 苦手克服 ネットワーク編
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
 1 本 1 テーマ（苦手克服 ネットワーク編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
苦手克服 ネットワーク編
:::

## メールのプロトコル：送るのは全部 SMTP chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: おくるのはぜんぶ えすえむてぃーぴー
text: 送るのは全部 SMTP

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: うけとりは ぽっぷかあいまっぷ
text: 受け取りは POPかIMAP

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぽっぷは たんまつにおとす
text: POPは 端末に落とす

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: あいまっぷは さーばでかんり
text: IMAPは サーバで管理

:::diagram
- {1} 送信者
-> {1} SMTP
- {1} メールサーバ {!1}
-> {2} POP3 / IMAP
- {2} 受信者
:::
:::bullets
- {3} POP3：端末にダウンロードする
- {4} IMAP：サーバ上で管理する {!4}
:::

## ポート番号 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: にじゅうごばんは えすえむてぃーぴー
text: 25番は SMTP

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ごじゅうさんは でぃーえぬえす
text: 53は DNS

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: はちじゅうと よんよんさん
text: 80と 443

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: じゅしんはひゃくばんだい
text: 受信は100番台

:::bullets
- {1} 25：SMTP（ニコッと送信）
- {2} 53：DNS（ゴミのような名前を引く）
- {3} 80：HTTP ／ 443：HTTPS（よしさ ＝ 安全）
- {4} 110：POP3 ／ 143：IMAP（受信は 100 番台） {!4}
:::

## NAT と NAPT chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なっとは いちたいいちで
text: NATは 1対1で

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あどれすかえる なっぷとは
text: アドレス変える NAPTは

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぽーとばんごうも つかうから
text: ポート番号も 使うから

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: いちたいたで つなげるの
text: 1対多で つなげるの

:::bullets
- {1} NAT：IP アドレスを 1 対 1 で変換 {!2}
- {3} NAPT：ポート番号も使い、1 対多で変換 {!4}
:::
:::callout {3}
覚え方：P ＝ Port
:::

## ARP：IP アドレスから MAC アドレス chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいぴーから まっくをしらべる
text: IPから MACを調べる

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あーぷは あどれすかいけつ
text: ARPは アドレス解決

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でぃーえぬえすは なまえから
text: DNSは 名前から

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: でぃーえいちしーぴー あいぴーくばる
text: DHCP IP配る

:::bullets
- {1} ARP：IP アドレス → MAC アドレス（アドレス解決） {!2}
- {3} DNS：名前 → IP アドレス
- {4} DHCP：IP アドレスを自動で配る
:::

## CSMA/CD と CSMA/CA chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ゆうせんは しょうとつけんしゅつ
text: 有線は 衝突検出

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: しーえすえむえー しーでぃーのでぃーは
text: CSMA/CDのDは

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でぃてくしょん むせんはかいひ
text: Detection 無線は回避

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: しーえーのえーは あぼいだんす
text: CAのAは Avoidance

:::bullets
- {1} CSMA/CD：有線 LAN で衝突を検出（D ＝ Detection） {!2}
- {3} CSMA/CA：無線 LAN で衝突を回避（A ＝ Avoidance） {!4}
:::

## OSI の層と機器 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: だいいちそうは りぴーただ
text: 第1層は リピータだ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: にそうはまっくで すいっちだ
text: 2層はMACで スイッチだ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さんそうは あいぴーみる
text: 3層は IP見る

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: るーたがみちを えらぶのだ
text: ルータが道を 選ぶのだ

:::diagram direction=TB
- {3} 第 3 層：ルータ・L3 スイッチ（IP アドレスを見る） {!4}
--
- {2} 第 2 層：L2 スイッチ・ブリッジ（MAC アドレスを見る）
--
- {1} 第 1 層：リピータ（信号を増幅するだけ）
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- メールのプロトコル：送るのは全部 SMTP
- ポート番号
- NAT と NAPT
- ARP：IP アドレスから MAC アドレス
- CSMA/CD と CSMA/CA
- OSI の層と機器
:::
