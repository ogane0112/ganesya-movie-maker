---
title: 天国と地獄で覚えるIT用語 AI 編
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
 1 本 1 テーマ（AI 編）。用語ごとに 1 場面（4 小節・4 フレーズ）。左のスライドに、歌うフレーズに合わせて図解が出る。
-->

## 天国と地獄で覚えるIT用語 chords="C G7" grid=16 energy=mid
:::title
天国と地獄で覚えるIT用語
AI 編
:::

## 機械学習：データから規則を学ぶ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: でーたから きそくをまなぶ
text: データから 規則を学ぶ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: きかいがくしゅう きょうしありなしと
text: 機械学習 教師ありなしと

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: きょうかがくしゅう ほうびでまなぶ
text: 強化学習 ほうびで学ぶ

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: みっつのまなびかた あるのだよ
text: 3つの学び方 あるのだよ

:::bullets
- {1} データから規則（パターン）を学ぶ {!1}
- {2} 教師あり学習：正解つきのデータで学ぶ
- {2} 教師なし学習：正解なしで、似たものをまとめる
- {3} 強化学習：報酬が多くなる行動を学ぶ {!3}
:::

## ディープラーニング：多層のニューラルネットワーク chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: なんそうもかさねた
text: 何層も重ねた

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: にゅーらるねっと でぃーぷらーにんぐ
text: ニューラルネット ディープラーニング

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: とくちょうを じぶんでみつける
text: 特徴を 自分で見つける

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: がぞうやおんせい とくいだよ
text: 画像や音声 得意だよ

:::bullets
- {2} 多層のニューラルネットワーク {!2}
- {3} 特徴を自動で学ぶ（人が特徴を教えなくてよい） {!3}
- {4} 画像認識・音声認識・翻訳など
:::

## 過学習：訓練データに合わせすぎ chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: くんれんでーたに あわせすぎ
text: 訓練データに 合わせすぎ

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: かがくしゅうだと みしらぬでーたに
text: 過学習だと 見知らぬデータに

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あたらないのだ はんかできない
text: 当たらないのだ 汎化できない

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: けんしょうでーたで みはるのだ
text: 検証データで 見張るのだ

:::bullets
- {1} 訓練データに合わせすぎる {!2}
- {3} 新しいデータに当たらない（汎化できない）
- {4} 対策：検証データで確かめる・データを増やす {!4}
:::

## 生成 AI と LLM chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: ぶんしょうやがぞうを つくりだす
text: 文章や画像を 作り出す

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: せいせいえーあい たいりょうにまなぶ
text: 生成AI 大量に学ぶ

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: だいきぼげんごもでる
text: 大規模言語モデル

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: えるえるえむと よぶのだよ
text: LLMと 呼ぶのだよ

:::bullets
- {1} 文章や画像を生成する AI {!2}
- {2} 大量の文章で学習する
- {3} LLM：大規模言語モデル {!4}
:::

## ハルシネーション：もっともらしい誤り chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: もっともらしい まちがいを
text: もっともらしい 間違いを

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: はるしねーしょん こたえてしまう
text: ハルシネーション 答えてしまう

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: うのみにせず うらをとろう
text: うのみにせず 裏を取ろう

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: らぐでぶんしょ さんしょうさせる
text: RAGで文書 参照させる

:::bullets
- {1} 生成 AI がもっともらしい誤りを出す {!2}
- {3} うのみにせず、出典を確かめる
- {4} 対策：RAG（検索した文書を参照させてから答えさせる） {!4}
:::

## 適合率・再現率・F 値 chords="C G7,C C G7,C" grid=16 energy=high
melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: あたりといったなかの せいかいりつ
text: 当たりと言った中の 正解率

melody: D4 - D4 - D4 F4 E4 D4 C4 C5 B4 A4 G4 F4 E4 D4 |
lyrics: てきごうりつだよ あたりをひろえた
text: 適合率だよ 当たりを拾えた

melody: C4 - - - D4 F4 E4 D4 G4 - G4 - G4 A4 E4 F4 |
lyrics: わりあいは さいげんりつ
text: 割合は 再現率

melody: D4 - D4 - D4 F4 E4 D4 C4 - G3 - D4 E4 C4 - |
lyrics: ふたつのへいきん えふちだよ
text: 2つの平均 F値だよ

:::bullets
- {1} 適合率：当たりと予測した中で、本当に当たりの割合 {!2}
- {3} 再現率：本当の当たりのうち、拾えた割合 {!3}
- {4} F 値：適合率と再現率の調和平均
:::

## おさらい chords="F G7 C C" grid=16 energy=low
:::bullets
- 機械学習：データから規則を学ぶ
- ディープラーニング：多層のニューラルネットワーク
- 過学習：訓練データに合わせすぎ
- 生成 AI と LLM
- ハルシネーション：もっともらしい誤り
- 適合率・再現率・F 値
:::
