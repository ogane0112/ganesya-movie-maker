// F9: BGM と効果音。
//   bgm: maou:<曲ID>     BGM カタログ（bgm/*.json）の曲。bgm/cache/ に取ってくる
//   bgm: <パス>          手元の音声ファイル
//   どちらもループ再生し、ナレーション中は自動で音量を下げる（ダッキング）。音の大きさは自動でそろえる
//   モーション動画では、曲のテンポ（songTempo）に場面の切れ目をそろえ、動画の頭を曲の小節の頭に合わせる
//   se: default | none | <パス>   シーンが切り替わるときの効果音（default はコードで合成した短いチャイム）
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fetchTrack, findTrack, loudnessOf, tempoOf, type BgmTrack } from "./bgm.js";
import type { Meta, TimelineAudio } from "./schema.js";
import { impact, SYNTH_PRESETS, synthesizeMusic, toWav, whoosh, type SynthPreset } from "./motion/synth.js";

/**
 * ナレーション（VOICEVOX）の音の大きさ（LUFS, 実測）。BGM はこの大きさにそろえてから bgmVolume を掛けるので、
 * どの曲でも bgmVolume が同じ意味になる（1.0 でナレーションと同じ大きさ）。
 */
export const NARRATION_LUFS = -24;

export async function prepareAudioAssets(
  meta: Meta,
  scriptPath: string,
  outDir: string,
  opts: { strict?: boolean; log?: (msg: string) => void; seconds?: number; start?: number } = {},
): Promise<TimelineAudio> {
  const audio: TimelineAudio = {};
  // bgm: synth:<プリセット> は、動画の長さと bpm に合わせてその場で合成する
  const synth = meta.bgm?.match(/^synth:(\w+)(?:@([A-G]#?))?$/);
  if (synth) {
    if (!SYNTH_PRESETS.includes(synth[1] as SynthPreset)) throw new Error(`bgm: synth: のプリセットは ${SYNTH_PRESETS.join(" / ")} です（${synth[1]}）`);
    const file = join(outDir, ".synth", `${synth[1]}-${meta.bpm}-${(opts.seconds ?? 60).toFixed(2)}-${synth[2] ?? "A"}.wav`);
    if (!existsSync(file)) {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, toWav(synthesizeMusic({ preset: synth[1] as SynthPreset, bpm: meta.bpm, seconds: opts.seconds ?? 60, key: synth[2] })));
    }
    const { lufs } = await loudnessOf(file);
    audio.bgm = {
      src: await copyAsset(file, outDir, "bgm"),
      volume: meta.bgmVolume * Math.min(4, Math.pow(10, (NARRATION_LUFS - lufs) / 20)),
      duck: 0.4,
      lufs,
      // 曲の頭が拍の頭なので、フェードインしない
      fadeIn: false,
    };
    return { ...audio, ...(await prepareSe(meta, scriptPath, outDir)) };
  }
  const song = await songFile(meta, scriptPath, opts);
  if (song) {
    const { lufs } = await loudnessOf(song.file);
    // 曲ごとの音の大きさの違いをならす（極端な増幅はしない）
    const gain = Math.min(4, Math.pow(10, (NARRATION_LUFS - lufs) / 20));
    const { track } = song;
    audio.bgm = {
      src: await copyAsset(song.file, outDir, "bgm"),
      volume: meta.bgmVolume * gain,
      duck: 0.4,
      lufs,
      credit: meta.bgmCredit ?? (track && `${track.credit}${track.title ? `「${track.title}」` : ""}`),
      // 小節の頭から鳴らすときは、最初の拍を立てたいのでフェードインしない
      ...(opts.start !== undefined && { start: opts.start, fadeIn: false }),
    };
  }
  return { ...audio, ...(await prepareSe(meta, scriptPath, outDir)) };
}

type SongOptions = { strict?: boolean; log?: (msg: string) => void };

/** bgm: の曲（カタログの曲か手元のファイル）。合成する曲・BGM なし・取れなかったときは undefined */
async function songFile(meta: Meta, scriptPath: string, opts: SongOptions): Promise<{ file: string; track?: BgmTrack } | undefined> {
  if (!meta.bgm || meta.bgm.startsWith("synth:")) return undefined;
  const track = await findTrack(meta.bgm);
  try {
    const file = track ? await fetchTrack(track) : join(dirname(scriptPath), meta.bgm);
    if (!existsSync(file)) throw new Error(`BGM のファイルがありません: ${file}`);
    return { file, track };
  } catch (e) {
    // 検査やキーフレームでは BGM は鳴らないので、無しで進める。書き出しでは止める
    if (opts.strict) throw e;
    opts.log?.(`${(e as Error).message}（BGM なしで進めます）`);
    return undefined;
  }
}

/**
 * モーション動画：曲のテンポと、動画の頭にする曲の秒（最初の小節の頭）。
 * カタログの bpm / offset、台本の bgmOffset があればそれを、なければ曲から測った値を使う
 */
export async function songTempo(meta: Meta, scriptPath: string, opts: SongOptions = {}): Promise<{ bpm: number; offset: number; confidence: number } | undefined> {
  const song = await songFile(meta, scriptPath, { ...opts, log: undefined });
  if (!song) return undefined;
  const measured = await tempoOf(song.file);
  return {
    bpm: song.track?.bpm ?? measured.bpm,
    offset: meta.bgmOffset ?? song.track?.offset ?? measured.offset,
    confidence: song.track?.bpm ? 1 : measured.confidence,
  };
}

/** モーション動画の場面転換の効果音（public/se/whoosh.wav・impact.wav）を書き出す */
export async function writeTransitionSounds(outDir: string): Promise<void> {
  await mkdir(join(outDir, "public/se"), { recursive: true });
  await writeFile(join(outDir, "public/se/whoosh.wav"), toWav(whoosh()));
  await writeFile(join(outDir, "public/se/impact.wav"), toWav(impact()));
}

async function prepareSe(meta: Meta, scriptPath: string, outDir: string): Promise<TimelineAudio> {
  if (meta.se === "none") return {};
  if (meta.se === "default") {
    await mkdir(join(outDir, "public/se"), { recursive: true });
    await writeFile(join(outDir, "public/se/transition.wav"), chime());
    return { se: { src: "se/transition.wav", volume: 0.5 } };
  }
  return { se: { src: await copyAsset(join(dirname(scriptPath), meta.se), outDir, "se"), volume: 0.5 } };
}

async function copyAsset(from: string, outDir: string, dir: string): Promise<string> {
  if (!existsSync(from)) throw new Error(`音声ファイルがありません: ${from}`);
  const name = `${dir}/${createHash("sha1").update(await readFile(from)).digest("hex").slice(0, 16)}${extname(from).toLowerCase()}`;
  await mkdir(join(outDir, "public", dir), { recursive: true });
  await copyFile(from, join(outDir, "public", name));
  return name;
}

/** 場面転換用の短いチャイム（2音、減衰するサイン波）。毎回同じ波形になる */
export function chime(sampleRate = 44100): Buffer {
  const notes = [
    { freq: 1046.5, start: 0, len: 0.35 }, // ド
    { freq: 1568.0, start: 0.07, len: 0.45 }, // ソ
  ];
  const total = Math.ceil(0.55 * sampleRate);
  const pcm = new Float32Array(total);
  for (const n of notes) {
    const s0 = Math.floor(n.start * sampleRate);
    for (let i = 0; i < n.len * sampleRate && s0 + i < total; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, t / 0.005) * Math.exp(-t * 9);
      pcm[s0 + i] += 0.35 * env * (Math.sin(2 * Math.PI * n.freq * t) + 0.25 * Math.sin(4 * Math.PI * n.freq * t));
    }
  }
  const buf = Buffer.alloc(44 + total * 2);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + total * 2, 4);
  buf.write("WAVEfmt ", 8, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(total * 2, 40);
  pcm.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return buf;
}
