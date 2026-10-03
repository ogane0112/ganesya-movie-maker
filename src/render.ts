// F5: MP4 書き出しとプレビュー（Remotion）
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPOSITION_ID } from "../remotion/constants.js";
import { findBrowser } from "./browser.js";
import type { Timeline } from "./schema.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "remotion/index.ts");

export async function renderVideo(
  timeline: Timeline,
  outDir: string,
  output: string,
  log: (msg: string) => void,
): Promise<void> {
  log("バンドル中…");
  const serveUrl = await bundle({ entryPoint: entry, publicDir: join(outDir, "public") });
  const inputProps = { timeline, withAudio: true };
  const browserExecutable = findBrowser() ?? null;
  const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps, browserExecutable, logLevel: "error" });
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    outputLocation: output,
    browserExecutable,
    logLevel: "error",
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) log(`レンダリング ${pct}%`), (last = pct);
    },
  });
}

/** Remotion Studio をブラウザで開く。台本を直したら gmm preview をやり直す。 */
export async function preview(timeline: Timeline, outDir: string, port?: number): Promise<number> {
  const props = join(outDir, "props.json");
  await writeFile(props, JSON.stringify({ timeline, withAudio: true }));
  const args = ["remotion", "studio", entry, `--props=${props}`, `--public-dir=${join(outDir, "public")}`];
  if (port) args.push(`--port=${port}`);
  const child = spawn("npx", args, { cwd: root, stdio: "inherit" });
  return new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 0)));
}
