@AGENTS.md

## 開発メモ

- テスト: `npm test` / 型チェック: `npm run typecheck`
- 部品を足すときは `remotion/parts/` に置き、`src/schema.ts`（Element と ResolvedElement）、`src/parse.ts`（buildElement）、`src/timeline.ts`（resolveElement）、`src/inspect/rules.ts`（文字数・表示時間）を合わせて更新する
- 部品を足したり見た目を変えたりしたら、`docs/parts.md` と見本（`docs/parts/gallery.md`）を直し、`scripts/parts-docs.sh` で画像を作り直す
- 部品のルート要素には `data-gmm-el`、文字には `data-gmm-text` を付ける（検査が測る対象）
- 乱数・現在時刻を使わない（同じ台本なら同じ動画になること）
- 動画を作る・直すときは司令塔のスキル `gmm` から始め、工程ごとの機能スキル（`gmm-setup` / `gmm-marp` / `gmm-explainer-script` / `gmm-rta-script` / `gmm-motion-script` / `gmm-skit-script` / `gmm-song-script` / `gmm-terms` / `gmm-bgm` / `gmm-review` / `gmm-render`）を使う
- モーション動画の部品は `remotion/motion/parts.tsx`（3D は `three.tsx`）、型は `src/motion/schema.ts`、解決は `src/motion/timeline.ts`。足したら `docs/motion.md` と見本（`docs/motion/gallery.md`）も直す
- ネタ動画（layout: skit）は、型・指示が `src/skit/schema.ts`、台本は `src/skit/parse.ts`、解決は `src/skit/timeline.ts`、描画は `remotion/skit/`、効果音は `src/skit/sfx.ts`（コードで合成）。指示や効果を足したら `docs/skit.md` と `gmm-skit-script` スキル、`gmm se list` の一覧も直す
- 曲（layout: song）は、楽譜の部品が `src/music/score.ts`、台本は `src/music/parse.ts`、伴奏は `src/music/arrange.ts`、歌唱は `src/music/sing.ts`（VOICEVOX の sing_frame_audio_query → frame_synthesis）、曲とタイムラインは `src/music/song.ts`。動画はネタ動画の舞台（`remotion/skit/`）で描く。伴奏の型や書式を変えたら `docs/song.md` と `gmm-song-script` スキルも直す
- スキルの分け方：`gmm` は順番と判断だけ、各 `gmm-*` は1つの工程だけ（入力・手順・終わりの条件）。CLI や書式を変えたら、その工程のスキルも直す。工程を足したら `gmm` の表にも足す
