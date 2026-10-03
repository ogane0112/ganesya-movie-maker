# ganesya-movie-maker (`gmm`)

台本（Markdown）を書けば、解説動画（16:9・日本語ナレーション付き）を作るCLI。
要件は [docs/requirements.md](docs/requirements.md)。

LLM が苦手な2点をツール側で肩代わりする：

- **時間軸** — タイミングはナレーション音声の長さから自動で決まる。台本には「何番目の文で何を出すか」だけを書く
- **出力が見えない** — `gmm check` が はみ出し・重なり・文字サイズ・情報量・表示時間 を数値で検査し、`gmm frames` がキーフレームを PNG で書き出す。AI はそれを見て台本を直す

## 必要なもの

- Node.js 20+
- [VOICEVOX エンジン](https://voicevox.hiroshiba.jp/)（`http://127.0.0.1:50021`）。なければ無音の仮音声（長さは文字数から推定）で動く
  ```sh
  docker run -d --rm -p 50021:50021 voicevox/voicevox_engine:cpu-latest
  ```
- Chromium（Remotion と検査で使う）。`GMM_BROWSER` で実行ファイルを指定できる。未指定なら Remotion が自動でダウンロードする（検査側は `npx playwright install chromium` が必要）

```sh
npm install
./bin/gmm.mjs build examples/dynamodb.md   # 検査 → キーフレーム → MP4
```

## コマンド

どのコマンドも台本（`.md`）かシーン定義JSON（`.json`）を受け取り、パース→音声→タイミングをやり直してから実行する。
音声は文ごとにキャッシュされるので、変えた文だけが作り直される。出力は `build/<台本名>/`（`-o` で変更）。

| コマンド | 内容 |
| --- | --- |
| `gmm check <台本>` | 自動検査。エラーがあれば終了コード 1。`--json` で機械可読 |
| `gmm frames <台本>` | 各シーンの最終フレームを `frames/sXX.png` に、一覧を `frames/overview.png` に書き出す。`--steps` で文ごとの途中経過も、`--scene s02` で絞り込み |
| `gmm render <台本>` | `video.mp4` に書き出す |
| `gmm preview <台本>` | Remotion Studio でプレビュー |
| `gmm build <台本>` | check → frames → render。検査エラーがあれば MP4 は作らない（`--force` / `--no-render`） |
| `gmm parse <台本>` | `scenes.json` を書き出すだけ |

共通オプション: `--tts auto|voicevox|silent`、`--voicevox-url`、`-o <dir>`。
進行状況は stderr、結果は stdout に出る。

## 台本フォーマット

```markdown
---
title: DynamoDBのパーティションキー入門
theme: wakaba        # wakaba（緑基調）/ dark
voice: zundamon      # zundamon / metan / tsumugi / … / VOICEVOX の話者ID / 日本語の話者名
speed: 1.0           # 読み上げ速度
---

## なぜキー設計が大事か          ← シーン（見出しは画面上部に出る）

DynamoDBでは、データの置き場所がキーで決まります。   ← ナレーション。。！？と改行で文に分かれる
キーが偏ると、一部のサーバーにアクセスが集中します。

:::bullets
- {1} 置き場所はキーで決まる      ← {n}: n番目の文が始まるときに出す
- {2} 偏るとホットパーティション {!2}   ← {!n}: n番目の文で強調マーカーを引く
:::
```

| 部品 | 書き方 | |
| --- | --- | --- |
| タイトル | `:::title {n}` の中に 1行目タイトル、2行目サブタイトル | タイトルだけのシーンは見出しバーを出さない |
| 箇条書き | `:::bullets` の中に `- {n} 文` | 項目ごとに順に出る。`{!n}` で強調 |
| コード | `:::code lang=ts {n} highlight="{1}:1 {2}:2-3,5"` | Shiki で色付け。`{文}:{行}` で文に合わせて行をハイライト |
| テキスト | `:::text {n}` / `:::callout {n}` | 本文 / 枠付きの要点 |

`{n}` を省略した部品はシーンの冒頭から出る。台本の誤り（存在しない文番号、未知の部品など）は行番号付きで報告される。

### シーン定義JSON

台本は内部で `scenes.json`（仕様は [src/schema.ts](src/schema.ts) の `SceneDoc`）に変換される。
AI が JSON を直接書いて `gmm build scenes.json` としてもよい。

## 出力ディレクトリ

```
build/<台本名>/
  scenes.json          シーン定義
  audio-timing.json    文ごとの音声ファイルと秒数
  timeline.json        フレーム単位に解決したタイムライン（Remotion に渡す）
  public/audio/*.wav   ナレーション音声（ハッシュ名でキャッシュ）
  check.json           検査結果
  frames/              キーフレーム（overview.png = 全シーン一覧）
  video.mp4
```

## 構成

```
src/
  cli.ts             CLI
  schema.ts          シーン定義・タイムラインの型（zod）
  parse.ts           F1 台本パース
  tts/               F2 音声合成（VOICEVOX / 無音の仮音声）
  timeline.ts        F3 自動タイミング
  inspect/rules.ts   F6 検査ルール（しきい値は LIMITS）
  inspect/index.ts   F6/F7 Playwright で測定・キーフレーム撮影
  inspect/page.tsx   検査用ページ（Remotion の Thumbnail で任意フレームを描画）
  render.ts          F5 MP4 書き出し・プレビュー
remotion/
  Video.tsx          全体の構成（シーン → 見出し + 部品）
  parts/             F4 部品集（Title / Bullets / Code / Text）
  theme.ts           テーマ
```

検査は、動画と同じ React 部品をブラウザで描き、`data-gmm-el`（部品）・`data-gmm-text`（文字）・`data-gmm-clip`（はみ出すと切れる行）
の付いた要素の位置を測って判定する。部品を足すときはこの属性を付ける。

## 権利

- VOICEVOX の音声はキャラクターごとに利用規約とクレジット表記が異なる。公開前に各キャラクターの規約を確認し、動画の概要欄などに「VOICEVOX:ずんだもん」のように表記する
- フォント: Noto Sans JP / JetBrains Mono（どちらも SIL Open Font License）を `@fontsource` から同梱
- Remotion は個人・小規模チームは無料、それ以外は会社ライセンスが必要（[ライセンス](https://www.remotion.dev/license)）

## 開発

```sh
npm test          # vitest
npm run typecheck
```
