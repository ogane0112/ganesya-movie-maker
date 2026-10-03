// 台本 → シーン定義 → 音声 → タイムライン までをまとめて行う。
// どのコマンドもここを通るので、台本を直したら同じコマンドを打ち直すだけでよい
// （音声はキャッシュされるので、変えた文だけ作り直される）。
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { loadCharacter } from "./character.js";
import { parseScript } from "./parse.js";
import { SceneDoc, type Timeline } from "./schema.js";
import { buildTimeline } from "./timeline.js";
import { synthesizeAll, type TtsProvider } from "./tts/index.js";

export type PipelineOptions = {
  out?: string;
  tts: TtsProvider;
  voicevoxUrl: string;
  log: (msg: string) => void;
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
  const doc = await loadSceneDoc(input);
  await writeFile(join(outDir, "scenes.json"), JSON.stringify(doc, null, 2));
  const audio = await synthesizeAll(doc, outDir, { provider: opts.tts, voicevoxUrl: opts.voicevoxUrl, log: opts.log });
  const character = await loadCharacter(doc, input, outDir);
  const timeline = await buildTimeline(doc, audio, character);
  const credits = [audio.credit, character?.credit].filter(Boolean);
  await writeFile(join(outDir, "credits.txt"), credits.join("\n") + (credits.length ? "\n" : ""));
  await writeFile(join(outDir, "timeline.json"), JSON.stringify(timeline, null, 2));
  opts.log(`タイムライン: ${timeline.scenes.length}シーン / ${(timeline.durationInFrames / timeline.meta.fps).toFixed(1)}秒`);
  return { doc, timeline, outDir };
}
