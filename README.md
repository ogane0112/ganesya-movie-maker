# ganesya-movie-maker (`gmm`)

台本（Markdown）を書けば、解説動画（16:9・日本語ナレーション付き）や、ゲーム実況・RTA 動画（biim システム）を作るCLI。
要件は [docs/requirements.md](docs/requirements.md)。

LLM が苦手な2点をツール側で肩代わりする：

- **時間軸** — タイミングはナレーション音声の長さから自動で決まる。台本には「何番目の文で何を出すか」だけを書く
- **出力が見えない** — `gmm check` が はみ出し・重なり・文字サイズ・情報量・表示時間・字幕の行数・表情の戻し忘れ・専門用語の説明漏れ を検査し、`gmm frames` がキーフレームを PNG で書き出す。AI はそれを見て台本を直す

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
| `gmm render <台本>` | `video.mp4` に書き出す。映像はシーンごとにキャッシュし、変わったシーンだけ作り直す（`--no-cache` で全部） |
| `gmm preview <台本>` | Remotion Studio でプレビュー |
| `gmm build <台本>` | check → frames → render。検査エラーがあれば MP4 は作らない（`--force` / `--no-render`） |
| `gmm parse <台本>` | `scenes.json` を書き出すだけ |
| `gmm bgm list [--tag 落ち着き]` | BGM カタログ（`bgm/*.json`）を雰囲気・合う場面つきで一覧する |
| `gmm bgm fetch maou:acoustic50` | カタログの曲を `bgm/cache/` に取ってくる（書き出し時にも自動で取る） |
| `gmm footage <録画> [--every 5]` | ゲーム録画の下見。時刻付きのコマ一覧画像と、暗転（ロード）区間の `!cut` 候補を出す |
| `gmm marp <スライド.md>` | Marp スライドを台本の下書きにする（下記「Marp スライドから作る」） |
| `gmm terms <台本>` | 専門用語の候補（カタカナ語・英字の語）を回数・初出・glossary の有無つきで一覧する |
| `gmm character import <psd> <dir>` | 立ち絵 PSD をレイヤーごとの PNG に分解する（下記「立ち絵」） |

共通オプション: `--tts auto|voicevox|silent`、`--voicevox-url`、`-o <dir>`。
進行状況は stderr、結果は stdout に出る。

## 台本フォーマット

```markdown
---
title: DynamoDBのパーティションキー入門
theme: wakaba        # wakaba（緑基調）/ dark / テーマJSONのパス
voice: zundamon      # zundamon / metan / tsumugi / … / VOICEVOX の話者ID / 日本語の話者名
character: zundamon  # 立ち絵（none / builtin / characters/<名前>/）
subtitles: burn      # 字幕: burn（焼き込み＋SRT）/ srt（SRTだけ）/ none
bgm: maou:acoustic50 # BGM（カタログの曲名か、ファイルのパス）。ナレーション中は自動で音量を下げる。省略可
bgmVolume: 0.3       # ナレーションがないときの BGM の大きさ（曲の音量はナレーションにそろえてあり、1.0 で同じ）
bgmCredit: "BGM: 曲名 / 作者"   # credits.txt に書く（カタログの曲なら自動）
se: default          # 場面転換の効果音: default（組み込み）/ none / ファイルのパス
speed: 1.0           # 読み上げ速度
glossary:            # 専門用語（用語: 一言の説明）。動画のどこかで必ず説明されているかを検査する
  シャーディング: 1つの値を、番号を付けて複数のキーに分けること
readings:            # 読みの辞書（表記: よみ）。字幕は表記のまま、読み上げだけ変わる
  S3: エススリー
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
| 図解 | `:::diagram direction=LR` の中に `- {n} 箱` と `-> {n} ラベル` を交互に | 箱を一列に並べて矢印でつなぐ（`->` `<-` `<->` `--`）。`{!n}` で箱を強調。TB で縦並び |
| 数式 | `:::math {n}` の中に TeX | KaTeX で描く。箇条書き・テキストの中では `$…$` でインライン数式 |
| 画像 | `:::image src=path.png {n}` の中にキャプション | 空いている高さに収まるよう縮める |
| 用語カード | `:::term {n}` の中に 1行目用語、2行目説明（省略時は glossary の説明） | 出る文でその用語を説明したことになる |

図解の例：

```markdown
:::diagram
- {1} 利用者
-> {2} HTTPS
- {2} API Gateway
->
- {3} DynamoDB {!3}
:::
```

`{n}` を省略した部品はシーンの冒頭から出る。
ナレーションの文頭に `{face:smile}` と書くと、その文から立ち絵の表情が変わる（次の指定まで続く）。
`{S3|エススリー}` のように書くと、字幕には `S3`、読み上げには `エススリー` を使う。

### 専門用語

解説動画では、専門用語を必ず一度、最初に使う所で説明する。`glossary:` に用語を書き、説明する文の文頭に
`{term:用語}` を付ける（または `:::term` の用語カードを出す）。`gmm check` は次を見つける：

- 説明している文がない用語 → エラー
- 説明より前のシーンで使っている用語 → 警告（同じシーン内なら直後の説明でよい。`:::title` のあるシーンは数えない）
- glossary にあるのに使っていない用語 → 警告

## Marp スライドから作る

```sh
./bin/gmm.mjs marp slides.md            # slides-video.md ができる（-o で変更）
```

スライド1枚が1シーンになる。見出しはシーンの見出し、1枚目（か `_class: lead`）の見出しだけのスライドは表紙（`:::title`）。
箇条書き・コード・`$$` の数式・画像・引用（→ 要点の枠）・地の文はそれぞれの部品に、表は「1列目：残りの列」の箇条書きになる。

- **発表者ノート**（Marp の指示でない `<!-- -->` コメント）がナレーションになる。部品は話の順に `{n}` を付けて出す
- ノートがないスライドは、スライドの文を並べた**仮のナレーション**になる（`<!-- 下書き -->` の印つき）。話し言葉に直す
- 変換しきれないもの（背景画像・多すぎる箇条書きやコード）は `<!-- 要確認: … -->` として台本に残し、終わりに一覧を出す
- 画像のパスは台本からの相対パスに書き換える

下書きを作った後は、ナレーションを直し、`gmm terms` で専門用語を `glossary:` に入れて、いつもの検査ループに入る。
例：`examples/marp/cache-basics.md`（スライド）→ `examples/marp/cache-basics-video.md`（直した台本）。

## AI エージェントで作る

Claude Code では、スキル `explainer-video`（`.claude/skills/explainer-video/`）が「〜の解説動画を作って」で使われる。
構成 → 専門用語の洗い出し → 台本 → 検査 → キーフレームの目視 → 書き出し の手順と、台本の早見表・確認項目が入っている。台本の誤り（存在しない文番号、未知の部品など）は行番号付きで報告される。

### シーン定義JSON

台本は内部で `scenes.json`（仕様は [src/schema.ts](src/schema.ts) の `SceneDoc`）に変換される。
AI が JSON を直接書いて `gmm build scenes.json` としてもよい。

## 立ち絵

画面右下に解説役の立ち絵を出す。口パクは VOICEVOX の音素タイミング（母音の間だけ口を開ける）に合わせ、
まばたきは決まった間隔で行う。部品は立ち絵に重ならないよう右側を空けて配置され、重なれば検査で見つかる。

- `character: builtin` — 組み込みキャラ（SVG）。素材なしで試せる。表情: normal / smile / surprised / troubled / think
- `character: zundamon` — `characters/zundamon/`（坂本アヒル氏の「ずんだもん立ち絵素材」）。表情: normal / smile / surprised / troubled / think / angry
- `character: metan` — `characters/metan/`（坂本アヒル氏の「四国めたん立ち絵素材」）。表情は zundamon と同じ

### 立ち絵の準備（ずんだもん・四国めたん）

素材の PSD はリポジトリに含めていない。手元の PSD をレイヤーごとの PNG に分解する：

```sh
./bin/gmm.mjs character import "ずんだもん立ち絵素材2.3.psd" characters/zundamon
./bin/gmm.mjs character import "四国めたん立ち絵素材2.1.psd" characters/metan
```

`characters/<名前>/layers/*.png` と `layers.json` ができる（Git 管理外）。
どの表情でどのパーツを使うかは `characters/<名前>/character.json` に書いてある。

### character.json

レイヤー（同じ大きさの透過 PNG）を重ねて立ち絵を作る。表示されるのは
`base` + 表情の `layers` + 目（まばたき中は `blink`、それ以外は `eyes`）+ 口（口パク中は `open`、それ以外は `mouth`）。
`eyes` / `blink` / `mouth` / `open` は最上位に既定値を書き、表情ごとに上書きできる。

```json
{
  "name": "ずんだもん",
  "credit": "立ち絵：坂本アヒル",
  "layersFile": "layers.json",
  "crop": { "x": 240, "y": 90, "width": 740, "height": 1060 },
  "height": 680,
  "face": { "x": 490, "y": 410 },
  "base": ["尻尾的なアレ", "服装1/いつもの服", "服装1/左腕/基本", "服装1/右腕/基本", "顔色/ほっぺ", "枝豆/枝豆通常"],
  "eyes": ["目/目セット/普通白目", "目/目セット/黒目/普通目"],
  "blink": ["目/なごみ目"],
  "mouth": ["口/むふ"],
  "open": ["口/ほあ"],
  "expressions": {
    "normal": { "layers": ["眉/普通眉"] },
    "think": { "layers": ["眉/困り眉2", "服装1/左腕/考える"], "mouth": ["口/むー"], "open": ["口/ほー"] }
  }
}
```

- レイヤー名は `gmm character import` が出力する PSD 内のパス（`*` `!` を除いたもの）
- PSDTool と同じく、`*` 付きレイヤーを表情で指定すると、同じグループの `base` のレイヤーは外れる（例: 腕を「考える」に差し替え）
- `crop` は元画像のうち表示する範囲、`height` は画面上の高さ（px）
- `face` は元画像での顔の中心。ゲーム実況の丸い枠で、顔をここに合わせて切り抜く
- `facing` は顔の向き（left / right / front）、`color` は掛け合いでのその人の色
- `layersFile` を省略すると、レイヤー名を PNG ファイル名として扱う（自作の PNG を並べる場合）

## BGM

`bgm/maou.json` は魔王魂の曲のカタログ（曲ページ・曲名・タグ・説明・解説動画で合う場面）。
`gmm bgm list` がこれを読みやすく出すので、AI エージェントは動画の雰囲気に合う曲を選べる。台本に `bgm: maou:<曲ID>` と書くと：

- 書き出し時に曲ページから MP3 を探して `bgm/cache/` に取ってくる（取れなければ、手で置く場所をエラーに出す）
- 曲の音の大きさ（LUFS）を測り、ナレーションの大きさにそろえる。`bgmVolume` はどの曲でも同じ意味になる
- ナレーション中は自動で音量を下げ、最初と最後はフェードする
- クレジット「BGM: 魔王魂「曲名」」を `credits.txt` に出す

魔王魂の音源は再配布禁止なので、リポジトリには入れない（`bgm/cache/` は Git 管理外）。カタログの説明は曲ページの説明から写したもので、
試聴して確かめた曲は `"heard": true` にする。曲を足すときは `bgm/maou.json` に追記する。

## ゲーム実況（biim システム）

フロントマターに `layout: biim` と書くと、ゲーム実況の台本として読む。画面は `biimFrame:` で選ぶ：

- `overlay`（既定）— ゲームを左上に、右の列の手前・字幕の上端まで大きく出し、右の列にタイマーと小ネタ（`!note`）。左下に1人目・右下に2人目の話者が向かい合い、字幕は二人の間
- `stage` — 上にゲーム、下の段で二人が向かい合う。左の柱に題名、右の柱にタイマーと区間
- `classic` — biim システムのおなじみの枠（左上にゲーム、右に区間とタイマー、左下の丸に話している人の顔）。
  `frameImage: frame.png`（1920×1080 の透過 PNG）で枠を画像に差し替えられる
- `simple` — 箱を並べただけの画面

話者は `speakers:` に書いた順に左・右に立つ。立ち絵の `character.json` の `facing`（顔の向き）を見て、内側を向くよう左右反転する。
名札と字幕の枠は `character.json` の `color` の色になる。

```markdown
---
title: サンプルクエスト Any% RTA 2:14.00
layout: biim
video: sample-run.mp4      # 録画
runStart: 0:06             # 録画内で計測を始めた時刻
runEnd: 2:20               # 終えた時刻
category: Any%
speakers:                  # 話者: VOICEVOX の声（書いた順に左・右に立つ）
  めたん: metan
  ずんだもん: zundamon
characters:                # 話者: 立ち絵（素材がなければ builtin-metan など組み込みキャラの色違いで代用）
  めたん: metan
  ずんだもん: zundamon
---

!cut 0:50-0:54             # ロードを切る
!fast 1:05-1:30 x4         # 倍速

@0:00                      # 録画のこの時刻に話し始める
ずんだもん: はい、よーいスタートなのだ。
めたん: 今回遊ぶのは、サンプルクエストね。

## 1-1 @0:06               # 区間。録画のこの時刻から
!note 計測は 1-1 の開始から   # 小ネタ。次の発言から右の欄に出る（!note だけで消す）
```

- 発言は前の発言が終わるまで待つ。`@` の時刻より 3 秒以上遅れると `gmm check` が知らせる（`lag`）
- タイマーは録画の時刻から実時間で出す（カット・倍速の区間でも実時間で進む）。区間を終えるとそのタイムが一覧に出る
- ゲーム音はナレーションに音量をそろえ、実況中は自動で下げる。倍速区間は無音
- 録画の下見：`gmm footage <録画>` が N 秒ごとのコマを時刻付きの一覧画像にする。AI エージェントはこれを見て実況を下書きする
  （スキル `rta-video`）。仕組みを試す仮の録画は `examples/rta/make-sample-run.sh` で作れる。完成例は `examples/rta/sample-run.md`
- 検査用のブラウザ（Playwright の Chromium）は H.264 を再生できないので、`check` / `frames` では録画のコマを ffmpeg で切り出して表示する。MP4 の書き出しには影響しない

## テーマ

`theme:` に組み込みテーマ名（`wakaba` / `dark`）か、テーマ JSON のパスを書く。JSON は変えたい項目だけ書けばよい。

```json
{
  "extends": "wakaba",
  "accent": "#e07a5f",
  "fontSize": 52,
  "subtitle": { "background": "rgba(90, 42, 30, 0.85)", "stroke": "none" },
  "fonts": [{ "family": "My Font", "src": "fonts/MyFont.woff2", "weight": 400 }],
  "fontFamily": "\"My Font\", \"Noto Sans JP\", sans-serif"
}
```

項目の一覧は [remotion/theme.ts](remotion/theme.ts) の `Theme`。

## 出力ディレクトリ

```
build/<台本名>/
  scenes.json          シーン定義
  audio-timing.json    文ごとの音声ファイルと秒数
  timeline.json        フレーム単位に解決したタイムライン（Remotion に渡す）
  public/audio/*.wav   ナレーション音声（ハッシュ名でキャッシュ）
  public/characters/   立ち絵のレイヤー（使うものだけ）
  public/images, bgm, se, fonts/   台本で使う素材のコピー
  subtitles.srt        SRT 字幕
  credits.txt          クレジット表記（VOICEVOX・立ち絵・BGM）
  check.json           検査結果
  frames/              キーフレーム（overview.png = 全シーン一覧）
  .segments/           シーンごとの映像キャッシュ（F10）
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
  render.ts          F5/F10 シーン単位の書き出し・キャッシュ・結合、プレビュー
  mix.ts             F10 音声トラックの合成（ナレーション・BGM・効果音）
  audio.ts           F9 BGM・効果音の準備（組み込みチャイムの合成）
  subtitles.ts       F8 SRT 字幕
  theme.ts           F13 テーマ JSON の解決
  character.ts       F14 立ち絵の読み込み（character.json → 表情ごとのレイヤー集合）
  psd.ts             F14 PSD → レイヤー PNG
  biim/              F18/F19 ゲーム実況：台本パーサ・タイムライン（カット・倍速・待ち行列）・録画の下見
remotion/
  Video.tsx          全体の構成（シーン → 見出し + 部品）
  parts/             F4 部品集（Title / Bullets / Code / Text / Diagram / Math / Image）と組み込みキャラ
  Character.tsx      F14 立ち絵（口パク・まばたき・表情）
  Subtitle.tsx       F8 焼き込み字幕
  Sound.tsx          F9 BGM（ダッキング）・効果音
  biim/              F18 ゲーム実況の画面とタイマー
  layout.ts          画面の割り付け（立ち絵・字幕の分の余白）
  theme.ts           組み込みテーマとテーマの型
```

検査は、動画と同じ React 部品をブラウザで描き、`data-gmm-el`（部品）・`data-gmm-text`（文字）・`data-gmm-clip`（はみ出すと切れる行）
の付いた要素の位置を測って判定する。部品を足すときはこの属性を付ける。

## 権利

- VOICEVOX の音声はキャラクターごとに利用規約とクレジット表記が異なる。公開前に各キャラクターの規約を確認し、動画の概要欄などに「VOICEVOX:ずんだもん」のように表記する（`credits.txt` に必要な表記をまとめて出力する）
- ずんだもん立ち絵素材（坂本アヒル氏）は動画での利用・改変が可能、クレジット表記は任意。[東北ずん子・ずんだもんプロジェクトのガイドライン](https://zunko.jp/guideline.html)に従う。素材そのものはリポジトリに含めない
- フォント: Noto Sans JP / JetBrains Mono（どちらも SIL Open Font License）を `@fontsource` から同梱。数式は KaTeX のフォント（MIT）
- BGM: 魔王魂（森田交一氏）の曲は無料・商用可。クレジットに「魔王魂」を表記する（`credits.txt` に自動で出る）。曲だけの再配布は禁止なので音源はリポジトリに入れない。[規約](https://maou.audio/rule/)
- 手元の BGM を使うときは、その規約に従って `bgmCredit:` にクレジットを書く。組み込みの効果音はコードで合成したもので、権利上の制約はない
- Remotion は個人・小規模チームは無料、それ以外は会社ライセンスが必要（[ライセンス](https://www.remotion.dev/license)）

## 開発

```sh
npm test          # vitest
npm run typecheck
```
