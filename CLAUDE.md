@AGENTS.md

## 開発メモ

- テスト: `npm test` / 型チェック: `npm run typecheck`
- 部品を足すときは `remotion/parts/` に置き、`src/schema.ts`（Element と ResolvedElement）、`src/parse.ts`（buildElement）、`src/timeline.ts`（resolveElement）、`src/inspect/rules.ts`（文字数・表示時間）を合わせて更新する
- 部品のルート要素には `data-gmm-el`、文字には `data-gmm-text` を付ける（検査が測る対象）
- 乱数・現在時刻を使わない（同じ台本なら同じ動画になること）
- 解説動画を作る・直すときはスキル `explainer-video` に従う。手順やルールを変えたら `.claude/skills/explainer-video/` も更新する
