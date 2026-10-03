// F6 自動検査 と F7 キーフレーム書き出し。
// 検査用ページを esbuild で作り、Playwright で開いて各シーンの最終フレームを測る・撮る。
import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright-core";
import { findBrowser } from "../browser.js";
import type { ResolvedScene, Timeline } from "../schema.js";
import { checkFaces, checkLayout, checkScene, checkSubtitle, checkTerms, type Issue } from "./rules.js";

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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** 出力ディレクトリを配信するだけのHTTPサーバー（file:// だとスクリプトとフォントが読めないため） */
async function serve(root: string): Promise<{ url: string; server: Server }> {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    try {
      // staticFile() の参照（public/ 以下）もそのまま引けるようにする
      const body = await readFile(join(root, path)).catch(() => readFile(join(root, "public", path)));
      res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" }).end(body);
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
      issues.push(...checkScene(scene, timeline));
      await session.show(finalFrame(scene));
      const label = `${scene.id}「${scene.heading}」`;
      const m = await session.page.evaluate(() => window.gmm.measure());
      issues.push(...checkLayout(m, label));
      // 字幕は文ごとに変わるので、各文の表示中に測る（立ち絵は字幕の横に置くので重なりの対象から外す）
      const contentEls = m.elements.filter((e) => e.kind !== "character");
      for (const s of scene.sentences) {
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
      if (opts.mode === "steps") {
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
    if (!opts.scenes) await writeOverview(session, shots.filter((s) => !/-\d+\.png$/.test(s.file)), outDir);
  } finally {
    await session.close();
  }
  return shots;
}

async function writeOverview({ page, baseUrl }: InspectSession, shots: FrameShot[], outDir: string) {
  const cols = Math.min(3, shots.length);
  const cells = shots
    .map(
      (s) =>
        `<figure><img src="${baseUrl}/${s.file}"><figcaption>${s.label.replace(/</g, "&lt;")}</figcaption></figure>`,
    )
    .join("");
  const width = cols * 640 + (cols + 1) * 16;
  await page.setViewportSize({ width, height: 400 });
  await page.setContent(
    `<style>body{margin:0;padding:16px;background:#333;font:20px sans-serif;color:#fff;display:grid;grid-template-columns:repeat(${cols},640px);gap:16px}figure{margin:0}img{width:640px;height:360px;display:block}figcaption{padding:6px 0}</style>${cells}`,
  );
  // 画像がすべて読み込まれるまで待つ（decode() は大量の画像で失敗することがあるので load を待つ）
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
  await page.screenshot({ path: join(outDir, "frames/overview.png"), fullPage: true });
}
