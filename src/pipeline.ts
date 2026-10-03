// 台本 → シーン定義 → 音声 → タイムライン までをまとめて行う。
// どのコマンドもここを通るので、台本を直したら同じコマンドを打ち直すだけでよい
// （音声はキャッシュされるので、変えた文だけ作り直される）。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { prepareAudioAssets } from "./audio.js";
import { loadCharacter } from "./character.js";
import { parseScript } from "./parse.js";
import { SceneDoc, type Timeline } from "./schema.js";
import { toSrt } from "./subtitles.js";
import { loadTheme } from "./theme.js";
import { buildTimeline } from "./timeline.js";
import { synthesizeAll, type TtsProvider } from "./tts/index.js";

export type PipelineOptions = {
  out?: string;
  tts: TtsProvider;
  voicevoxUrl: string;
  log: (msg: string) => void;
  /** MP4 を書き出すとき true。VOICEVOX に繋がらない・BGM が取れないときに、無しで進めずにエラーにする */
  requireVoice?: boolean;
};

export function defaultOutDir(input: string): string {
  const name = basename(input, extname(input)).replace(/\.scenes$/, "");
  return join("build", name);
}

/** .md は台本として、.json はシーン定義JSONとして読む */
export async function loadSceneDoc(input: string): Promise<SceneDoc> {
  const src = await readFile(input, "utf8");
  if (input.endsWith(".json")) {
    const r = SceneDoc.safeParse(JSON.parse(src));
    if (!r.success) {
      throw new Error(`シーン定義JSONが不正です:\n${r.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
    }
    return r.data;
  }
  return parseScript(src);
}

export async function prepare(input: string, opts: PipelineOptions): Promise<{ doc: SceneDoc; timeline: Timeline; outDir: string }> {
  const outDir = opts.out ?? defaultOutDir(input);
  await mkdir(outDir, { recursive: true });
  const doc = await copyImages(await loadSceneDoc(input), input, outDir);
  await writeFile(join(outDir, "scenes.json"), JSON.stringify(doc, null, 2));
  const audio = await synthesizeAll(doc, outDir, {
    provider: opts.tts,
    voicevoxUrl: opts.voicevoxUrl,
    log: opts.log,
    requireVoice: opts.requireVoice,
  });
  const character = await loadCharacter(doc, input, outDir);
  const theme = await loadTheme(doc.meta.theme, input, outDir);
  const audioAssets = await prepareAudioAssets(doc.meta, input, outDir, { strict: opts.requireVoice, log: opts.log });
  const timeline = await buildTimeline(doc, audio, theme, character, audioAssets);
  const credits = [audio.credit, character?.credit, audioAssets.bgm?.credit].filter(Boolean);
  await writeFile(join(outDir, "credits.txt"), credits.join("\n") + (credits.length ? "\n" : ""));
  await writeFile(join(outDir, "timeline.json"), JSON.stringify(timeline, null, 2));
  if (doc.meta.subtitles !== "none") await writeFile(join(outDir, "subtitles.srt"), toSrt(timeline));
  opts.log(`タイムライン: ${timeline.scenes.length}シーン / ${(timeline.durationInFrames / timeline.meta.fps).toFixed(1)}秒`);
  return { doc, timeline, outDir };
}

/** :::image の画像を public/images/ にコピーし、src を public からの相対パスにする */
async function copyImages(doc: SceneDoc, input: string, outDir: string): Promise<SceneDoc> {
  for (const scene of doc.scenes) {
    for (const el of scene.elements) {
      if (el.type !== "image" || el.src.startsWith("images/")) continue;
      const from = join(dirname(input), el.src);
      if (!existsSync(from)) throw new Error(`画像がありません: ${from}（シーン「${scene.heading}」）`);
      const body = await readFile(from);
      const name = `images/${createHash("sha1").update(body).digest("hex").slice(0, 16)}${extname(from).toLowerCase()}`;
      await mkdir(join(outDir, "public/images"), { recursive: true });
      await copyFile(from, join(outDir, "public", name));
      el.src = name;
    }
  }
  return doc;
}
