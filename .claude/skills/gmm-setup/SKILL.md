---
name: gmm-setup
description: gmm で動画を作る前の準備をする機能スキル。VOICEVOX エンジンの起動確認、ずんだもん・四国めたんの立ち絵素材の取り込み（gmm character import）、ゲーム録画の置き場所の確認を行う。gmm スキルの最初の工程として使う。「VOICEVOX が動かない」「立ち絵を取り込んで」と単独で頼まれたときも使う。
---

# 前提をそろえる

## 入力

- 作る動画の種類（解説 1人／掛け合い／ゲーム実況）

## 手順

### VOICEVOX

```sh
curl -s localhost:50021/version
```

- 返事がなければ起動する：`docker run -d --rm -p 50021:50021 voicevox/voicevox_engine:cpu-latest`
  （docker が止まっていれば `dockerd` から。起動には 1 分ほどかかるので、`/version` が返るまで待つ）
- 検査（`check`）とキーフレーム（`frames`）は `--tts silent` の仮音声でも動く。**書き出し（`render`）には VOICEVOX が必須**
- 環境によっては、ターンをまたぐと docker が止まる。書き出しのときは、起動の確認と `render` を同じコマンドで続けて実行する

### 立ち絵

| 使う人 | 置き場所 | なければ |
| --- | --- | --- |
| ずんだもん | `characters/zundamon/layers.json` | 坂本アヒル氏の「ずんだもん立ち絵素材」の PSD を頼み、取り込む |
| 四国めたん | `characters/metan/layers.json` | 同じく「四国めたん立ち絵素材」 |

```sh
./bin/gmm.mjs character import "ずんだもん立ち絵素材2.3.psd" characters/zundamon
./bin/gmm.mjs character import "四国めたん立ち絵素材2.1.psd" characters/metan
```

- 分解した PNG と `layers.json` は Git に入れない（素材の再配布になるため。`.gitignore` 済み）
- 表情の割り当て（`character.json`）は Git にある。新しい素材なら README の「character.json」を見て書く
- 素材が手に入らなければ、組み込みキャラ（`builtin`、色違いの `builtin-metan`）で進め、そのことを利用者に伝える

### ゲーム録画（ゲーム実況のとき）

- 録画ファイルを、台本と同じフォルダかその下に置いてもらう（台本の `video:` は台本からの相対パス）
- 仕組みを試すだけなら、仮の録画を `examples/rta/make-sample-run.sh` で作れる

## 終わりの条件

- VOICEVOX が返事をする（書き出しまで進むとき）
- 使う立ち絵の `layers.json` がある、または組み込みキャラで進めると利用者に伝えた
- ゲーム実況なら、録画の場所がわかっている
