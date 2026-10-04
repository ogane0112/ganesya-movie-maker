---
name: gmm
description: gmm（台本から動画を作る CLI）で動画を作る・直すときの司令塔。依頼の種類（解説動画・2人の掛け合い・スライドから・ゲーム実況/RTA・既存動画の修正）を見分け、工程ごとの機能スキル（gmm-setup / gmm-marp / gmm-explainer-script / gmm-rta-script / gmm-terms / gmm-bgm / gmm-review / gmm-render）を順に使って、MP4 を渡すまで進める。「〜の解説動画を作って」「このスライドを動画にして」「RTA動画を作って」「この録画に実況を付けて」「動画を直して」と頼まれたら最初にこれを使う。
---

# gmm で動画を作る（司令塔）

このスキルは**順番と判断**だけを持つ。各工程のやり方は機能スキルに書いてあるので、工程ごとにそのスキルを読んで従う。
道具はすべて CLI `./bin/gmm.mjs`（MCP サーバーはない）。

## 1. 依頼を見分ける

| 依頼 | 種類 | 使う工程（順に） |
| --- | --- | --- |
| 「〜の解説動画を作って」 | 解説（1人） | setup → explainer-script → terms → bgm → review → render |
| 「2人で」「掛け合いで」 | 解説（掛け合い） | 同上（explainer-script の「掛け合い」で書く） |
| Marp の `.md` を渡され「動画にして」 | スライドから | setup → **marp** → explainer-script（直す）→ terms → bgm → review → render |
| 録画を渡され「RTA動画」「実況を付けて」 | ゲーム実況（`layout: biim`） | setup → **rta-script** → terms → bgm → review → render |
| 既存の台本・動画を「直して」 | 修正 | （指摘の内容に応じて script / terms / bgm）→ review → render |
| 「BGMだけ選んで」など一部だけ | 単発 | その機能スキルだけ |

工程のスキル名はすべて `gmm-` で始まる（例: setup → `gmm-setup`）。

## 2. 最初に確かめること（わからなければ聞く）

- 解説：誰向けか（前提知識）、長さの目安（既定 3〜5 分）、1人か掛け合いか
- ゲーム実況：録画の場所、ゲーム名、レギュレーション（Any% など）、計測の開始・終了の基準
- 台本の置き場所（指定がなければ `examples/`）
- 聞かずに決めてよいこと：BGM の曲、表情、部品の選び方、シーンの分け方（決めた理由を最後に伝える）

## 3. 工程をつなぐときの決まり

- 各機能スキルの「終わりの条件」を満たしてから次へ進む。満たせなければ、その工程に戻るか利用者に聞く
- 台本を直したら、必ず `gmm-review` からやり直す（音声は変えた文だけ作り直されるので、何度回してもよい）
- `gmm-review` が合格するまで `gmm-render` に進まない（`gmm build` は検査エラーがあれば MP4 を作らない）
- 台本に秒数は書かない。タイミングは `{n}`（解説）と `@時刻`（ゲーム実況）だけで決める
- ツール自体の不具合（検査の見逃し、描画の崩れ）に気づいたら、台本でごまかさず利用者に伝える。直せるならコードを直す
  （コードを直したら `npm run typecheck` と `npm test`）

## 4. 渡すときに伝えること

`gmm-render` の「渡し方」に従い、最後に次をまとめて伝える：

- 動画（と 720p 版）、キーフレーム、`credits.txt` のクレジット（概要欄に載せる）
- 決めたこと（BGM の曲と理由、構成）
- 確認したこと／していないこと（BGM は試聴していない、読み間違いは聴いていない、ゲームは数秒おきのコマしか見ていない など）
- 残っている `<!-- 要確認 -->`

## 工程スキルの一覧

| スキル | やること | 主なコマンド |
| --- | --- | --- |
| `gmm-setup` | VOICEVOX・立ち絵・録画など前提をそろえる | `curl localhost:50021/version`、`gmm character import` |
| `gmm-marp` | Marp スライドを台本の下書きにする | `gmm marp` |
| `gmm-explainer-script` | 解説動画の構成と台本（1人／掛け合い） | — |
| `gmm-rta-script` | 録画を下見して、時刻付きの実況台本を書く | `gmm footage` |
| `gmm-terms` | 専門用語を洗い出し、最初に使う所で説明させる | `gmm terms` |
| `gmm-bgm` | BGM を選ぶ | `gmm bgm list` |
| `gmm-review` | 検査とキーフレームの目視で直す | `gmm check`、`gmm frames` |
| `gmm-render` | MP4 に書き出して渡す | `gmm render` / `gmm build` |
