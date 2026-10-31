---
title: 天国と地獄で覚える応用情報
layout: song
bpm: 120
music: pop
singer: zundamon
transpose: 3             # ハ長調 → 変ホ長調。ずんだもんの歌いやすい高さに
character: builtin
format: wide
---

<!--
 メロディ：オッフェンバック「天国と地獄」（地獄のギャロップ／カンカン。1858 年・パブリックドメイン）の有名な主題。
 1 升 = 16 分音符（grid=16）。原曲の 2/4 拍子の 2 小節を、ここでは 1 小節にまとめている。
 1 番＝ネットワーク（DNS・DHCP）、2 番＝データベース（正規化・ACID）、3 番＝セキュリティ（公開鍵暗号・ハッシュ）。
 どの番も「意味 → 用語」「用語 → 意味」の順で、同じ旋律に乗せて覚える。show: の用語は画面の上に大きく出る。
-->

## イントロ chords="C G7" grid=16 energy=mid

## 1番 ネットワーク chords="C G7,C C G7,C" grid=16 energy=high bg=sunburst
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なまえから あいぴーひく
text: 名前から IP引く
show: 名前 → IPアドレス

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: でぃーえぬえす なまえかいけつだ
text: DNS 名前解決だ
show: DNS\n名前解決

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいぴーを じどうでかす
text: IPを 自動で貸す
show: IPアドレスを\n自動で割り当て

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: でぃーえいちしーぴーだよ
text: DHCP だよ
show: DHCP

## 2番 データベース chords="C G7,C C G7,C" grid=16 energy=high bg=dots
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: せいきかは むだをへらす
text: 正規化は ムダを減らす
show: 正規化\n重複をなくす

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: おなじでーた いっかいだけかく
text: 同じデータ 一回だけ書く
show: 同じデータは\n1か所だけ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あしっどは しょりのきまり
text: ACIDは 処理の決まり
show: ACID\nトランザクションの性質

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぜんぶかぜろ きえないよ
text: 全部かゼロか 消えないよ
show: 原子性・一貫性\n独立性・永続性

## 3番 セキュリティ chords="C G7,C C G7,C" grid=16 energy=high bg=speed
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: かぎふたつ こうかいかぎ
text: 鍵二つ 公開鍵
show: 公開鍵暗号\n鍵は2つ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: あんごうかは あいてのかぎでね
text: 暗号化は 相手の鍵でね
show: 相手の公開鍵で\n暗号化

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: はっしゅちは もどせないの
text: ハッシュ値は 戻せないの
show: ハッシュ値\n元に戻せない

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: かいざん すぐにみつかる
text: 改ざん すぐに見つかる
show: 改ざんの検知

## おわり chords="G7 C" grid=16 energy=low
