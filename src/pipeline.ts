// 台本 → シーン定義 → 音声 → タイムライン までをまとめて行う。
// どのコマンドもここを通るので、台本を直したら同じコマンドを打ち直すだけでよい
// （音声はキャッシュされるので、変えた文だけ作り直される）。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { NARRATION_LUFS, prepareAudioAssets, songTempo, writeTransitionSounds } from "./audio.js";
import { writeCustomRegistry } from "./motion/custom.js";
import { parseMotionScript } from "./motion/parse.js";
import { buildMotionTimeline } from "./motion/timeline.js";
import { placeFootage, probeVideo } from "./biim/footage.js";
import { buildBiimTimeline } from "./biim/timeline.js";
import { loudnessOf } from "./bgm.js";
import { loadCast, loadCharacter } from "./character.js";
import { parseBiimScript } from "./biim/parse.js";
import { parseFrontMatter, parseScript } from "./parse.js";
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
  // layout: biim ならゲーム実況の台本として読む
  const { meta } = parseFrontMatter(src.replace(/\r\n/g, "\n").split("\n"));
  return meta.layout === "biim" ? parseBiimScript(src) : meta.layout === "motion" ? parseMotionScript(src) : parseScript(src);
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
  if (doc.meta.layout === "biim") return prepareBiim(doc, audio, input, outDir, opts);
  if (doc.meta.layout === "motion") return prepareMotion(doc, audio, input, outDir, opts);
  // 掛け合い（speakers:）なら話者ごとの立ち絵、そうでなければ character: の1人
  const duo = Object.keys(doc.meta.speakers).length > 0;
  const cast = duo ? await loadCast(doc, input, outDir) : undefined;
  const character = duo ? undefined : await loadCharacter(doc, input, outDir);
  const theme = await loadTheme(doc.meta.theme, input, outDir);
  const audioAssets = await prepareAudioAssets(doc.meta, input, outDir, { strict: opts.requireVoice, log: opts.log });
  const timeline = await buildTimeline(doc, audio, theme, character, audioAssets, cast);
  const credits = [audio.credit, character?.credit, ...(cast ?? []).map((c) => c.character?.credit), audioAssets.bgm?.credit].filter(Boolean);
  await writeFile(join(outDir, "credits.txt"), [...new Set(credits)].join("\n") + (credits.length ? "\n" : ""));
  await writeFile(join(outDir, "timeline.json"), JSON.stringify(timeline, null, 2));
  if (doc.meta.subtitles !== "none") await writeFile(join(outDir, "subtitles.srt"), toSrt(timeline));
  opts.log(`タイムライン: ${timeline.scenes.length}シーン / ${(timeline.durationInFrames / timeline.meta.fps).toFixed(1)}秒`);
  return { doc, timeline, outDir };
}

/** :::image の画像を public/images/ にコピーし、src を public からの相対パスにする */
async function copyImages(doc: SceneDoc, input: string, outDir: string): Promise<SceneDoc> {
  for (const scene of doc.scenes) {
    // 解説動画の :::image と、モーション動画の :::shot
    const withSrc = [...scene.elements.filter((e) => e.type === "image"), ...(scene.motion ?? []).filter((e) => e.type === "shot")] as { src: string }[];
    for (const el of withSrc) {
      if (el.src.startsWith("images/")) continue;
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

/** モーション動画（layout: motion）：場面のコードの登録表・転換の効果音・拍に合わせたタイムライン・曲 */
async function prepareMotion(
  doc: SceneDoc,
  audio: Awaited<ReturnType<typeof synthesizeAll>>,
  input: string,
  outDir: string,
  opts: PipelineOptions,
): Promise<{ doc: SceneDoc; timeline: Timeline; outDir: string }> {
  await writeCustomRegistry(doc, input, outDir);
  await prepareMotionAssets(doc, input, outDir);
  await writeTransitionSounds(outDir);
  const theme = await loadTheme(doc.meta.theme, input, outDir);
  // 魔王魂などの曲なら、場面の切れ目を曲の拍にそろえる（台本の bpm: が曲の 2 倍・半分なら同じ拍の並びなのでそのまま）
  const song = await songTempo(doc.meta, input, { strict: opts.requireVoice });
  if (song) {
    const same = [0.5, 1, 2].some((r) => Math.abs(doc.meta.bpm / song.bpm - r) < 0.005);
    if (!same) opts.log(`BGM のテンポ ${song.bpm} BPM に合わせます（台本の bpm: ${doc.meta.bpm} は使いません。台本にも bpm: ${song.bpm} と書くと、曲がない環境でも同じ長さになります）`);
    if (song.confidence < 0.3) opts.log(`BGM の拍がはっきりしない曲です（${song.bpm} BPM と測りました）。聴いてずれていたら、カタログに bpm / offset を書くか bgmOffset: で直してください`);
    if (!same) doc.meta.bpm = song.bpm;
  }
  const timeline = buildMotionTimeline(doc, audio, theme);
  // 合成する曲は動画の長さに合わせるので、タイムラインの後で用意する
  timeline.audio = await prepareAudioAssets(doc.meta, input, outDir, {
    strict: opts.requireVoice,
    log: opts.log,
    seconds: timeline.durationInFrames / doc.meta.fps,
    start: song?.offset,
  });
  await writeFile(join(outDir, "timeline.json"), JSON.stringify(timeline, null, 2));
  if (doc.meta.subtitles !== "none") await writeFile(join(outDir, "subtitles.srt"), toSrt(timeline));
  const credits = [doc.scenes.some((s) => s.sentences.length) ? audio.credit : undefined, timeline.audio.bgm?.credit].filter(Boolean);
  await writeFile(join(outDir, "credits.txt"), credits.join("\n") + (credits.length ? "\n" : ""));
  opts.log(`タイムライン: ${timeline.scenes.length}場面 / ${(timeline.durationInFrames / doc.meta.fps).toFixed(1)}秒（${doc.meta.bpm} BPM${song ? `・曲の ${song.offset.toFixed(2)} 秒目から` : ""}）`);
  return { doc, timeline, outDir };
}

/** モーション動画：エディタに見せるファイルを読み込み、動画の一部（:::clip）を public/clips/ に置く */
async function prepareMotionAssets(doc: SceneDoc, input: string, outDir: string): Promise<void> {
  for (const scene of doc.scenes) {
    for (const el of scene.motion ?? []) {
      if (el.type === "editor" && el.src) {
        const file = join(dirname(input), el.src);
        if (!existsSync(file)) throw new Error(`エディタに見せるファイルがありません: ${file}（場面「${scene.heading}」）`);
        let lines = (await readFile(file, "utf8")).replace(/\r\n/g, "\n").split("\n");
        const range = el.lines?.match(/^(\d+)-(\d+)$/);
        if (range) lines = lines.slice(Number(range[1]) - 1, Number(range[2]));
        el.code = lines.join("\n").replace(/\s+$/, "");
      }
      if (el.type === "clip" && !el.src.startsWith("clips/")) {
        const from = join(dirname(input), el.src);
        if (!existsSync(from)) throw new Error(`動画がありません: ${from}（場面「${scene.heading}」。先にその動画を書き出してください）`);
        const name = `clips/${createHash("sha1").update(from).update(String((await stat(from)).mtimeMs)).digest("hex").slice(0, 16)}${extname(from).toLowerCase()}`;
        await mkdir(join(outDir, "public/clips"), { recursive: true });
        if (!existsSync(join(outDir, "public", name))) await copyFile(from, join(outDir, "public", name));
        el.src = name;
      }
    }
  }
}

/** ゲーム実況（layout: biim）：録画を調べて置き、話者ごとの立ち絵を読み、タイムラインを作る */
async function prepareBiim(
  doc: SceneDoc,
  audio: Awaited<ReturnType<typeof synthesizeAll>>,
  input: string,
  outDir: string,
  opts: PipelineOptions,
): Promise<{ doc: SceneDoc; timeline: Timeline; outDir: string }> {
  const video = join(dirname(input), doc.meta.video!);
  const probe = await probeVideo(video);
  const src = await placeFootage(video, outDir);
  // ゲーム音の大きさをナレーションにそろえる（音が無い録画は 0）
  let gameGain = 0;
  if (probe.hasAudio) {
    const { lufs } = await loudnessOf(video, { byStat: true });
    gameGain = Number.isFinite(lufs) ? Math.min(4, Math.pow(10, (NARRATION_LUFS - lufs) / 20)) : 0;
  }
  const theme = await loadTheme(doc.meta.theme, input, outDir);
  const cast = await loadCast(doc, input, outDir);
  const audioAssets = await prepareAudioAssets(doc.meta, input, outDir, { strict: opts.requireVoice, log: opts.log });
  // 枠の画像は public/frames/ に置く
  let frameImage: string | undefined;
  if (doc.meta.frameImage) {
    const from = join(dirname(input), doc.meta.frameImage);
    if (!existsSync(from)) throw new Error(`枠の画像がありません: ${from}`);
    frameImage = `frames/${basename(from)}`;
    await mkdir(join(outDir, "public/frames"), { recursive: true });
    await copyFile(from, join(outDir, "public", frameImage));
  }
  const timeline = buildBiimTimeline(doc, audio, theme, cast, { src, ...probe }, audioAssets, gameGain, frameImage);
  await writeFile(join(outDir, "timeline.json"), JSON.stringify(timeline, null, 2));
  if (doc.meta.subtitles !== "none") await writeFile(join(outDir, "subtitles.srt"), toSrt(timeline));
  const credits = [audio.credit, ...cast.map((c) => c.character?.credit), audioAssets.bgm?.credit].filter(Boolean);
  await writeFile(join(outDir, "credits.txt"), [...new Set(credits)].join("\n") + (credits.length ? "\n" : ""));
  opts.log(`タイムライン: ${timeline.scenes.length}区間 / ${(timeline.durationInFrames / timeline.meta.fps).toFixed(1)}秒（録画 ${probe.duration.toFixed(1)}秒）`);
  return { doc, timeline, outDir };
}
