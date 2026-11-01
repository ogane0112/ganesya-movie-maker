---
title: 天国と地獄で覚えるIT用語 苦手克服 セキュリティ編
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
 1 本 1 テーマ（苦手克服 セキュリティ編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
苦手克服 セキュリティ編
:::

## ブルートフォースとリバースブルートフォース chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいでぃーこてい ぱすわーどを
text: ID固定 パスワードを

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: ぜんぶためすのが ぶるーとふぉーす
text: 全部試すのが ブルートフォース

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: りばーすは ぱすわーどこてい
text: リバースは パスワード固定

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: あいでぃーをかえて ろっくをさける
text: IDを変えて ロックを避ける

:::bullets
- {1} ブルートフォース：ID を固定し、パスワードを総当たり {!2}
- {3} リバース：よく使われるパスワードを固定し、ID を次々に変える {!3}
- {4} ID ごとの失敗回数が少ないので、アカウントロックが効きにくい
:::

## 辞書攻撃とパスワードリスト攻撃 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: じしょのたんごを ためしてく
text: 辞書の単語を 試してく

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: じしょこうげき よくあるわーどを
text: 辞書攻撃 よくあるワードを

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: もれたくみあわせ つかいまわす
text: 漏れた組み合わせ 使い回す

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぱすわーどりすと こうげきだ
text: パスワードリスト 攻撃だ

:::bullets
- {1} 辞書攻撃：ID を固定し、辞書の単語を試す {!2}
- {3} パスワードリスト攻撃：他で漏れた ID とパスワードの組を使い回す {!4}
:::
:::callout {4}
対策：同じパスワードを使い回さない
:::

## IDS と IPS：見つけるだけか、止めるか chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいでぃーえすは けんちして
text: IDSは 検知して

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: つうちだけ でぃてくしょんみつける
text: 通知だけ Detection見つける

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あいぴーえすは しゃだんまで
text: IPSは 遮断まで

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ぷりべんしょん ふせぐのだ
text: Prevention 防ぐのだ

:::bullets
- {1} IDS：不正を検知して通知だけ（D ＝ Detection ＝ 見つける） {!2}
- {3} IPS：検知して遮断まで（P ＝ Prevention ＝ 防ぐ） {!4}
:::

## WAF と UTM chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: うぇぶあぷりへの こうげきを
text: Webアプリへの 攻撃を

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: なかみでしゃだん わふはうぇぶよう
text: 中身で遮断 WAFはWeb用

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ゆーてぃーえむは いちだいに
text: UTMは 1台に

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: まとめたそうち ゆないふぁいど
text: まとめた装置 Unified

:::bullets
- {1} WAF：Web アプリへの攻撃（SQL インジェクション・XSS）を通信の中身から遮断 {!2}
- {3} UTM：ファイアウォール・ウイルス対策・IPS などを 1 台にまとめた装置（Unified ＝ 統合） {!4}
:::

## EDR・SIEM・サンドボックス chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: いーでぃーあーるは たんまつかんし
text: EDRは 端末監視

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: しーむは ろぐを あつめてぶんせき
text: SIEMは ログを 集めて分析

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: さんどぼっくす すなばのなかで
text: サンドボックス 砂場の中で

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: あやしいのを うごかすよ
text: 怪しいのを 動かすよ

:::bullets
- {1} EDR：端末を監視し、侵入後の調査と対応を支援（Endpoint ＝ 端末）
- {2} SIEM：各種ログを集めて相関分析 {!2}
- {3} サンドボックス：隔離した環境で怪しいプログラムを動かして調べる {!4}
:::

## CRL と OCSP：証明書の失効を確かめる chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: しっこうした しょうめいしょを
text: 失効した 証明書を

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: いちらんでもらう しーあーるえる
text: 一覧でもらう CRL

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: そのつどおんらいん といあわせ
text: その都度オンライン 問い合わせ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: おーしーえすぴーなのだ
text: OCSPなのだ

:::callout {1}
CA（認証局）：電子証明書を発行し、公開鍵の持ち主を保証
:::
:::bullets
- {2} CRL：失効した証明書の一覧（まとめて取り寄せる） {!2}
- {3} OCSP：失効しているかを、その都度オンラインで問い合わせる {!4}
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- ブルートフォースとリバースブルートフォース
- 辞書攻撃とパスワードリスト攻撃
- IDS と IPS：見つけるだけか、止めるか
- WAF と UTM
- EDR・SIEM・サンドボックス
- CRL と OCSP：証明書の失効を確かめる
:::
