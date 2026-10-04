# OSS化の判断材料

フェーズ3「OSS化の判断」のための整理。**判断は利用者が行う**。ここでは、公開するときに問題になる点と、選択肢をまとめる。

> 確認のしかた：Remotion は `node_modules/remotion/LICENSE.md`、立ち絵は素材に同梱の readme.txt を直接読んだ。
> VOICEVOX・東北ずん子・魔王魂の公式ページは、この作業環境のネットワーク制限で開けなかったため、検索結果（二次情報）から書いている。
> **公開前に、下の「公式で確かめること」を公式ページで確認すること。**

## 何が誰のものか

| もの | 権利・ライセンス | リポジトリに入っているか | 公開時の扱い |
| --- | --- | --- | --- |
| gmm のコード（src/・remotion/・test/ など） | 自作 | 入っている | ライセンスを選べる（下記） |
| Remotion | Remotion License（独自。OSS ライセンスではない） | 入っていない（npm で入る） | 依存として使うのは問題ない。使う人に条件がかかる（下記） |
| その他の依存（React・Shiki・KaTeX・zod・Playwright など） | MIT / Apache-2.0 | 入っていない | 問題なし |
| フォント（Noto Sans JP・JetBrains Mono） | OFL-1.1 | 入っていない（npm で入る） | 問題なし |
| VOICEVOX エンジン | 別配布（docker） | 入っていない | 問題なし。音声の利用には声ごとの規約がある |
| ずんだもん・四国めたんの立ち絵 PSD／書き出した PNG | 坂本アヒル氏 | **入っていない**（`.gitignore`） | 素材そのものは入れない（readme に再配布の許可がない） |
| 立ち絵の表情の割り当て（`characters/*/character.json`） | 自作（レイヤー名を並べたもの） | 入っている | 問題になりにくい。素材は利用者が自分で入手して `gmm character import` する |
| 部品集の見本画像（`docs/parts/img/*.png`） | 自作の画面＋ずんだもんの立ち絵 | **入っている** | 立ち絵が写っている。下の「要判断」参照 |
| BGM の音源（魔王魂） | 魔王魂 | 入っていない（`bgm/cache/` は Git 管理外） | 入れない |
| BGM のカタログ（`bgm/maou.json`） | 曲名・URL・説明。説明は曲ページから写したもの | 入っている | 説明文は自分の言葉に書き直すと安全 |
| サンプル録画（`examples/rta/sample-run.mp4`） | 自作（ffmpeg で生成） | 入っていない（スクリプトだけ） | 問題なし |

## 主な条件

### Remotion（いちばん大きい論点）

- 個人、社員 3 人までの営利団体、非営利団体は無料（商用の動画づくりも可）。それより大きい営利団体は Company License が要る
- **禁止**：Remotion のコードを複製・改変して、自分の「Remotion の派生物」として販売・貸与・再ライセンスすること
- gmm は Remotion を npm の依存として使うだけなので、gmm を公開すること自体はこの禁止に当たらない（と読める）
- ただし gmm を使う人にも Remotion License がかかる。**README に「Remotion を使うので、規模によっては Company License が要る」と明記する**必要がある
- 「Remotion 5.0 でライセンスが少し変わる」と LICENSE.md にある。公開時点の最新版を確認する

### VOICEVOX の声（ずんだもん・四国めたんなど）

- 声ごとに規約がある。ずんだもん・四国めたんは、クレジット「VOICEVOX:ずんだもん」などを書けば商用・非商用で使える、とされる
  （出典：[crystal-method.com](https://crystal-method.com/blog/voicevox-commercial/)、[Hakky Handbook](https://book.st-hakky.com/data-science/voicevox-usage-and-commercial-use)）
- gmm はクレジットを `credits.txt` に自動で出している。**動画の概要欄に貼る**運用を README に書いておく
- gmm のコードを公開することには関係しない（音声を同梱しないため）

### 東北ずん子・ずんだもんプロジェクト（キャラクター）

- 立ち絵素材の readme：「良識の範囲内で動画やアイコン等に自由に利用可」「公式の規約に準じて商用・改変可」「クレジットは任意」。
  再配布については書かれていない → 素材そのものは配らない（今の運用どおり）
- キャラクターの利用は公式ガイドラインに従う。動画投稿・配信目的なら企業でも問い合わせ不要になった、とされる
  （出典：[電ファミニコゲーマー](https://news.denfaminicogamer.jp/news/230328b)）
- ツールの README やアイコンにキャラクターの画像を使うことが「動画やアイコン等」に入るかは、公式ガイドラインで確かめる

### 魔王魂（BGM）

- 動画での利用は可。クレジット「魔王魂」の表記が必要、楽曲をそのまま素材として再配布・販売するのは禁止、とされる
  （出典：[ニコニコ大百科](https://dic.nicovideo.jp/a/%E9%AD%94%E7%8E%8B%E9%AD%82)）
- gmm は音源を同梱せず、利用者の手元に取ってくる作りなので、再配布には当たらない
- カタログの説明文は曲ページから写したもの。公開するなら自分の言葉に書き直す

## 選択肢

| | A. 非公開のまま | B. コードだけ公開（おすすめ） | C. 見本も含めてそのまま公開 |
| --- | --- | --- | --- |
| やること | なし | ライセンスを付け、立ち絵の写った見本画像を組み込みキャラで撮り直し、カタログの説明を書き直す | ライセンスを付ける |
| 立ち絵の画像 | — | リポジトリに入らない | 見本画像に入る |
| リスク | なし | 小さい | 立ち絵の扱いが素材の規約・公式ガイドラインに合うか確かめる必要がある |
| 手間 | なし | 半日ほど | 小さい |

### B を選ぶ場合の手順

1. ライセンスを決める（自作コードは MIT が素直。依存の Remotion は別ライセンスである旨を README に書く）
2. `LICENSE` を置き、README の冒頭に次を書く
   - Remotion を使うので、組織の規模によっては Remotion の Company License が要ること
   - 声（VOICEVOX）・立ち絵・BGM は同梱せず、それぞれの規約に従って利用者が用意すること
   - 動画を公開するときは `credits.txt` の内容を概要欄に書くこと
3. `docs/parts/gallery.md` を `character: builtin` にして `scripts/parts-docs.sh` で見本画像を作り直す
4. `bgm/maou.json` の `description` / `fit` を自分の言葉に書き直す
5. 履歴に素材が入っていないか確かめる（`git log --all --stat -- '*.psd' 'characters/*/layers*' 'bgm/cache'`）
6. リポジトリの公開設定を変える

## 公式で確かめること（公開前）

- [ ] Remotion の最新の LICENSE（5.0 での変更）と FAQ（https://www.remotion.pro/faq）
- [ ] VOICEVOX の利用規約と、ずんだもん・四国めたんの音声ライブラリの規約（https://zunko.jp/con_ongen_kiyaku.html）
- [ ] 東北ずん子・ずんだもんプロジェクトのキャラクター利用ガイドライン（https://zunko.jp/guideline.html）：README・見本画像にキャラクターを使ってよいか
- [ ] 魔王魂の利用規約（https://maou.audio/rule/）：クレジットの書き方、カタログに曲名・URL を載せてよいか
