// F6 自動検査 と F7 キーフレーム書き出し。
// 検査用ページを esbuild で作り、Playwright で開いて各シーンの最終フレームを測る・撮る。
import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { ffmpeg } from "../ffmpeg.js";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright-core";
import { findBrowser } from "../browser.js";
import { bundleAliases, nodeModulesDir } from "../motion/custom.js";
import type { ResolvedScene, Timeline } from "../schema.js";
import { checkBiimScene, checkFaces, checkLayout, checkMotionScene, checkScene, checkSkitScene, checkSubtitle, checkTerms, checkTextOverlap, type Issue } from "./rules.js";

const here = dirname(fileURLToPath(import.meta.url));

async function buildPage(outDir: string): Promise<void> {
  const dir = join(outDir, ".inspect");
  await build({
    entryPoints: [join(here, "page.tsx")],
    bundle: true,
    outdir: dir,
    format: "iife",
    jsx: "automatic",
    loader: { ".woff2": "file", ".woff": "file", ".ttf": "file" },
    define: { "process.env.NODE_ENV": '"production"' },
    // 場面のコード（:::custom）の登録表と道具
    alias: bundleAliases(outDir),
    nodePaths: [nodeModulesDir],
    logLevel: "error",
  });
  await writeFile(
    join(dir, "index.html"),
    `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="page.css"><style>html,body{margin:0;background:#000}</style><div id="root"></div><script src="page.js"></script>`,
  );
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** 出力ディレクトリを配信するだけのHTTPサーバー（file:// だとスクリプトとフォントが読めないため） */
async function serve(root: string): Promise<{ url: string; server: Server }> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    // ゲーム実況の録画のコマ（検査用ブラウザは H.264 を再生できないので、ffmpeg で切り出して渡す）
    if (path === "/__frame") {
      try {
        const src = normalize(url.searchParams.get("src") ?? "").replace(/^(\.\.[/\\])+/, "");
        const t = Math.max(0, Number(url.searchParams.get("t")));
        const out = join(root, ".inspect", `frame-${process.pid}-${Math.random().toString(36).slice(2)}.jpg`);
        await ffmpeg(["-ss", t.toFixed(3), "-i", join(root, "public", src), "-frames:v", "1", "-q:v", "3", out]);
        const body = await readFile(out);
        await rm(out, { force: true });
        res.writeHead(200, { "Content-Type": "image/jpeg" }).end(body);
      } catch {
        res.writeHead(404).end();
      }
      return;
    }
    try {
      // staticFile() の参照（public/ 以下）もそのまま引けるようにする
      const body = await readFile(join(root, path)).catch(() => readFile(join(root, "public", path)));
      const type = MIME[extname(path)] ?? "application/octet-stream";
      // 動画の頭出しには Range 要求への対応が要る
      const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
      if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
        res
          .writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${body.length}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 })
          .end(body.subarray(start, end + 1));
      } else {
        res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": body.length }).end(body);
      }
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, server };
}

export type InspectSession = {
  page: Page;
  baseUrl: string;
  close: () => Promise<void>;
  show: (frame: number) => Promise<void>;
};

export async function openInspector(timeline: Timeline, outDir: string): Promise<InspectSession> {
  await buildPage(outDir);
  const { url, server } = await serve(outDir);
  const browser = await chromium.launch({ executablePath: findBrowser() });
  const close = async () => {
    await browser.close();
    server.close();
  };
  const page = await browser.newPage({ viewport: { width: timeline.meta.width, height: timeline.meta.height } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(`${url}/.inspect/index.html`);
    await page.waitForFunction(() => "gmm" in window, null, { timeout: 15000 });
  } catch (e) {
    await close();
    throw new Error(`検査ページの読み込みに失敗しました: ${errors.join("\n") || (e as Error).message}`);
  }
  return {
    page,
    baseUrl: url,
    close,
    show: (frame) => page.evaluate(([t, f]) => window.gmm.show(t as Timeline, f as number), [timeline, frame] as const),
  };
}

/** シーンの「全部出そろった」フレーム（最終フレーム） */
const finalFrame = (s: ResolvedScene) => s.start + s.durationInFrames - 1;

export async function runChecks(timeline: Timeline, outDir: string): Promise<Issue[]> {
  const issues: Issue[] = [...checkTerms(timeline), ...checkFaces(timeline)];
  const session = await openInspector(timeline, outDir);
  try {
    for (const scene of timeline.scenes) {
      if (timeline.motion) {
        issues.push(...(await checkMotionFrames(session, scene, timeline)));
        continue;
      }
      if (timeline.skit) {
        issues.push(...(await checkSkitFrames(session, scene, timeline)));
        continue;
      }
      const biim = !!timeline.run;
      issues.push(...(biim ? checkBiimScene(scene, timeline, scene === timeline.scenes.at(-1)) : checkScene(scene, timeline)));
      await session.show(finalFrame(scene));
      const label = `${scene.id}「${scene.heading}」`;
      const m = await session.page.evaluate(() => window.gmm.measure());
      // ゲーム実況の画面は端まで使うので、画面からはみ出していないかだけを見る
      issues.push(...checkLayout(m, label, biim ? { safeMargin: 0 } : {}));
      // 字幕は文ごとに変わるので、各文の表示中に測る（立ち絵は字幕の横に置くので重なりの対象から外す）
      const contentEls = m.elements.filter((e) => e.kind !== "character");
      for (const s of scene.sentences.filter((x) => !x.carry)) {
        await session.show(scene.start + s.from + 1);
        const sub = await session.page.evaluate(() => window.gmm.measureSubtitle());
        if (sub) issues.push(...checkSubtitle(sub, contentEls, scene.id, label));
      }
    }
  } finally {
    await session.close();
  }
  return issues;
}

/**
 * モーション動画：部品が出て落ち着いたフレーム（checkFrames）ごとに測る（大きな文字は入れ替わるので、最後のフレームだけでは足りない）。
 * 部品はどれも全面の層なので重なりは見ず、はみ出し・文字の大きさと、字幕と文字の重なりを見る。
 */
async function checkMotionFrames(session: InspectSession, scene: ResolvedScene, timeline: Timeline): Promise<Issue[]> {
  const label = `${scene.id}「${scene.heading}」`;
  const issues: Issue[] = [...checkMotionScene(scene, timeline)];
  const seen = new Set<string>();
  const push = (list: Issue[]) => {
    for (const i of list) {
      const key = `${i.rule}:${i.message}`;
      if (!seen.has(key)) seen.add(key), issues.push(i);
    }
  };
  for (const f of scene.checkFrames ?? [scene.durationInFrames - 1]) {
    await session.show(scene.start + f);
    const m = await session.page.evaluate(() => window.gmm.measure());
    const at = `${label}（${(f / timeline.motion!.framesPerBeat + 1).toFixed(1)}拍目）`;
    push(checkLayout(m, at, { texts: true }));
    push(checkTextOverlap(m.texts, scene.id, at));
  }
  for (const s of scene.sentences) {
    await session.show(scene.start + s.from + 1);
    const sub = await session.page.evaluate(() => window.gmm.measureSubtitle());
    if (!sub) continue;
    const m = await session.page.evaluate(() => window.gmm.measure());
    push(checkSubtitle(sub, m.texts.map((t) => ({ kind: `文字「${t.text.slice(0, 12)}」`, rect: t.rect })), scene.id, label));
  }
  return issues;
}

/** ネタ動画のシーンで、出来事が落ち着くフレーム（各台詞の頭・テロップ・画像・スタンプが出た少し後と、最後） */
export function skitCheckFrames(scene: ResolvedScene, fps: number): number[] {
  const settle = Math.round(fps * 0.4);
  const sk = scene.skit!;
  const fs = [...scene.sentences.map((s) => s.from), ...sk.captions.map((c) => c.from), ...sk.pics.map((p) => p.from), ...sk.stamps.map((s) => s.from)];
  return [...new Set([...fs.map((f) => Math.min(scene.durationInFrames - 1, f + settle)), scene.durationInFrames - 1])].sort((a, b) => a - b);
}

/**
 * ネタ動画：台詞・テロップが出て落ち着いたフレームごとに測る。
 * はみ出し（文字は画面の端から）、テロップ・画像・帯どうしの重なり、字幕と それらの重なり・行数を見る。
 * 立ち絵・スタンプ・背景は重ねて使うものなので、重なりの対象から外す
 */
async function checkSkitFrames(session: InspectSession, scene: ResolvedScene, timeline: Timeline): Promise<Issue[]> {
  const label = `${scene.id}「${scene.heading}」`;
  const issues: Issue[] = [...checkSkitScene(scene, timeline)];
  const seen = new Set<string>();
  const push = (list: Issue[]) => {
    for (const i of list) {
      const key = `${i.rule}:${i.message}`;
      if (!seen.has(key)) seen.add(key), issues.push(i);
    }
  };
  const loose = new Set(["character", "stamp", "backdrop"]);
  for (const f of skitCheckFrames(scene, timeline.meta.fps)) {
    await session.show(scene.start + f);
    const m = await session.page.evaluate(() => window.gmm.measure());
    const fixed = { ...m, elements: m.elements.filter((e) => !loose.has(e.kind)) };
    const at = `${label}（${(f / timeline.meta.fps).toFixed(1)}秒）`;
    // 上の帯は画面の端まで使うので、はみ出しの対象から外す（中の文字は見る）
    push(checkLayout({ ...fixed, elements: fixed.elements.filter((e) => e.kind !== "banner") }, at, { texts: true }));
    const sub = await session.page.evaluate(() => window.gmm.measureSubtitle());
    if (sub) push(checkSubtitle(sub, fixed.elements, scene.id, at));
  }
  return issues;
}

export type FrameShot = { sceneId: string; frame: number; file: string; label: string };

/**
 * F7: シーンごとのキーフレームを書き出す。
 * mode=final: 各シーンの最終フレームだけ / mode=steps: 各ナレーション文の開始直後も撮る
 * 最後に全シーンを並べた overview.png を作る（AIが1枚で全体を見られるように）。
 */
export async function captureFrames(
  timeline: Timeline,
  outDir: string,
  opts: { mode: "final" | "steps"; scenes?: string[] },
): Promise<FrameShot[]> {
  const dir = join(outDir, "frames");
  await mkdir(dir, { recursive: true });
  const shots: FrameShot[] = [];
  const session = await openInspector(timeline, outDir);
  try {
    for (const scene of timeline.scenes) {
      if (opts.scenes && !opts.scenes.includes(scene.id)) continue;
      const targets: { frame: number; suffix: string; label: string }[] = [];
      if (opts.mode === "steps" && timeline.skit) {
        // ネタ動画：台詞・テロップが出て落ち着いたところを順に撮る
        skitCheckFrames(scene, timeline.meta.fps)
          .slice(0, -1)
          .forEach((f, i) => targets.push({ frame: scene.start + f, suffix: `-${i + 1}`, label: `${(f / timeline.meta.fps).toFixed(1)}秒` }));
      } else if (opts.mode === "steps" && timeline.motion) {
        // モーション動画：部品が出て落ち着いたところを順に撮る
        const fpb = timeline.motion.framesPerBeat;
        (scene.checkFrames ?? []).slice(0, -1).forEach((f, i) =>
          targets.push({ frame: scene.start + f, suffix: `-${i + 1}`, label: `${(f / fpb + 1).toFixed(1)}拍目` }),
        );
      } else if (opts.mode === "steps") {
        scene.sentences.forEach((s, i) =>
          // 出現アニメーション（約10フレーム）が終わったところを撮る
          targets.push({ frame: scene.start + Math.min(s.from + 15, scene.durationInFrames - 1), suffix: `-${i + 1}`, label: `${i + 1}文目「${s.text}」` }),
        );
      }
      targets.push({ frame: finalFrame(scene), suffix: "", label: "最終フレーム" });
      for (const t of targets) {
        await session.show(t.frame);
        const file = join(dir, `${scene.id}${t.suffix}.png`);
        await session.page.screenshot({ path: file });
        shots.push({ sceneId: scene.id, frame: t.frame, file: relative(outDir, file), label: `${scene.id}「${scene.heading}」${t.label}` });
      }
    }
    if (!opts.scenes) await writeOverview(session, shots.filter((s) => !/-\d+\.png$/.test(s.file)), outDir, timeline.meta.width / timeline.meta.height);
  } finally {
    await session.close();
  }
  return shots;
}

async function writeOverview({ page, baseUrl }: InspectSession, shots: FrameShot[], outDir: string, aspect = 16 / 9) {
  // 縦長の動画（ショート）は細いコマを多めに並べる
  const cellW = aspect < 1 ? 300 : 640;
  const cellH = Math.round(cellW / aspect);
  const cols = Math.min(aspect < 1 ? 6 : 3, shots.length);
  const cells = shots
    .map(
      (s) =>
        `<figure><img src="${baseUrl}/${s.file}"><figcaption>${s.label.replace(/</g, "&lt;")}</figcaption></figure>`,
    )
    .join("");
  const width = cols * cellW + (cols + 1) * 16;
  await page.setViewportSize({ width, height: 400 });
  await page.setContent(
    `<style>body{margin:0;padding:16px;background:#333;font:20px sans-serif;color:#fff;display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:16px}figure{margin:0}img{width:${cellW}px;height:${cellH}px;display:block}figcaption{padding:6px 0}</style>${cells}`,
  );
  // 画像がすべて読み込まれるまで待つ（decode() は大量の画像で失敗することがあるので load を待つ）
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
  await page.screenshot({ path: join(outDir, "frames/overview.png"), fullPage: true });
}
