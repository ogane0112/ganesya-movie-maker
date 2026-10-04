---
name: gmm-render
description: gmm の台本を MP4 に書き出して利用者に渡す機能スキル。gmm render / gmm build の使い方、VOICEVOX の起動と同じコマンドで書き出すこと、変わったシーンだけ書き出し直すキャッシュ、720p の軽い版、クレジット（credits.txt）と字幕（subtitles.srt）、渡すときに伝えること。gmm スキルの最後の工程として使う。「書き出して」「MP4にして」と単独で頼まれたときも使う。
---

# 書き出して渡す

## 入力

- `gmm-review` に合格した台本

## 手順

```sh
curl -s localhost:50021/version && ./bin/gmm.mjs render <台本>   # build/<台本名>/video.mp4
./bin/gmm.mjs build <台本>     # check → frames → render をまとめて（検査エラーがあれば MP4 は作らない）
```

- モーション動画でナレーションがなければ VOICEVOX はいらない。3D（`:::three`・Three.js の場面のコード）の場面は書き出しに時間がかかる
- **ナレーションがあれば VOICEVOX が必須。** 止まっていると書き出しは失敗する（仮音声で書き出すことはない）。
  環境によっては docker がターンをまたぐと止まるので、起動の確認と書き出しは同じコマンドで続けて実行する（`gmm-setup`）
- 2回目以降は変わったシーンだけ書き出す。全部やり直すなら `--no-cache`
- 3〜5 分の動画の初回はおよそ数分かかる。バックグラウンドで実行して待つ
- 送るのに重ければ 720p の版を作る：

  ```sh
  ffmpeg -y -i build/<台本名>/video.mp4 -vf scale=1280:720 -c:v libx264 -crf 26 -preset fast -c:a aac -b:a 128k build/<台本名>/video-720p.mp4
  ```

## 渡し方

- 動画（と 720p 版）、`frames/overview.png`、`subtitles.srt`
- `credits.txt` のクレジット（VOICEVOX・立ち絵・BGM）。動画の概要欄に載せてもらう
- 「確認したこと」と「確認していないこと」を分けて伝える（例: BGM・合成した曲は試聴していない、読み間違いは聴いていない、
  ゲーム実況では数秒おきのコマしか見ていない・ゲーム音は聞いていない）
- 残っている `<!-- 要確認 -->`

## 終わりの条件

- `video.mp4` ができ、上のものを利用者に渡した
