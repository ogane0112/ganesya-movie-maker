// F5: MP4 書き出しとプレビュー（Remotion）
// F10: 映像はシーンごとに書き出してキャッシュし、変わったシーンだけ作り直す。
//      音声は全体を Node で合成し（src/mix.ts）、最後に ffmpeg でつなぐ。
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPOSITION_ID } from "../remotion/constants.js";
import { findBrowser } from "./browser.js";
import { ffmpeg } from "./ffmpeg.js";
import { mixAudio } from "./mix.js";
import type { Timeline } from "./schema.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "remotion/index.ts");

/** シーン i だけを、開始フレーム 0 の1本の動画として描くためのタイムライン */
export function sceneTimeline(t: Timeline, i: number): Timeline {
  const scene = t.scenes[i];
  // このシーンが始まる時点の表情（前のシーンから引き継ぐ）
  const initialFace = t.scenes
    .slice(0, i)
    .flatMap((s) => s.sentences)
    .reduce<string | undefined>((face, s) => s.face ?? face, undefined);
  return {
    ...t,
    durationInFrames: scene.durationInFrames,
    scenes: [{ ...scene, start: 0 }],
    segment: { index: i, initialFace },
  };
}

/** 描画結果に関わるもの（描画コードと、画像・フォントなどの素材）のハッシュ */
async function renderInputsHash(outDir: string): Promise<string> {
  const h = createHash("sha1");
  const walk = async (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of (await readdir(dir)).sort()) {
      const p = join(dir, name);
      if ((await stat(p)).isDirectory()) await walk(p);
      else h.update(relative(root, p)).update(await readFile(p));
    }
  };
  await walk(join(root, "remotion"));
  h.update(await readFile(join(root, "package-lock.json")));
  for (const d of ["characters", "images", "fonts"]) await walk(join(outDir, "public", d));
  return h.digest("hex");
}

export async function renderVideo(
  timeline: Timeline,
  outDir: string,
  output: string,
  log: (msg: string) => void,
  opts: { cache?: boolean } = {},
): Promise<void> {
  const segDir = join(outDir, ".segments");
  await mkdir(segDir, { recursive: true });
  const base = await renderInputsHash(outDir);
  const segments = timeline.scenes.map((_, i) => {
    const t = sceneTimeline(timeline, i);
    const key = createHash("sha1").update(base).update(JSON.stringify(t)).digest("hex").slice(0, 16);
    return { i, t, file: join(segDir, `${timeline.scenes[i].id}-${key}.mp4`) };
  });
  const todo = segments.filter((s) => opts.cache === false || !existsSync(s.file));
  log(`映像: ${segments.length}シーン中 ${todo.length}シーンを書き出します（${segments.length - todo.length}シーンはキャッシュ）`);

  if (todo.length) {
    log("バンドル中…");
    const serveUrl = await bundle({ entryPoint: entry, publicDir: join(outDir, "public") });
    const browserExecutable = findBrowser() ?? null;
    const browser = await openBrowser("chrome", { browserExecutable, logLevel: "error" });
    try {
      for (const seg of todo) {
        const inputProps = { timeline: seg.t, withAudio: false };
        const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps, puppeteerInstance: browser, logLevel: "error" });
        const scene = timeline.scenes[seg.i];
        log(`  ${scene.id}「${scene.heading}」（${(scene.durationInFrames / timeline.meta.fps).toFixed(1)}秒）`);
        const tmp = `${seg.file}.part.mp4`;
        await renderMedia({
          serveUrl,
          composition,
          inputProps,
          codec: "h264",
          muted: true,
          outputLocation: tmp,
          puppeteerInstance: browser,
          logLevel: "error",
        });
        await rename(tmp, seg.file);
      }
    } finally {
      await browser.close({ silent: true });
    }
  }

  log("音声を合成中…");
  const audio = join(segDir, "audio.wav");
  await mixAudio(timeline, outDir, audio);

  log("結合中…");
  const list = join(segDir, "list.txt");
  await writeFile(list, segments.map((s) => `file '${resolve(s.file).replace(/'/g, "'\\''")}'`).join("\n") + "\n");
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output]);

  // 今回使わなかった古いシーンの映像を消す（ディスクを食わないように）
  const keep = new Set(segments.map((s) => s.file));
  for (const name of await readdir(segDir)) {
    const p = join(segDir, name);
    if (name.endsWith(".mp4") && !keep.has(p)) await rm(p, { force: true });
  }
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
