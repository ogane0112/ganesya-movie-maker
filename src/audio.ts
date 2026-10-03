// F9: BGM と効果音。
//   bgm: <パス>          ループ再生し、ナレーション中は自動で音量を下げる（ダッキング）
//   se: default | none | <パス>   シーンが切り替わるときの効果音（default はコードで合成した短いチャイム）
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import type { Meta, TimelineAudio } from "./schema.js";

export async function prepareAudioAssets(meta: Meta, scriptPath: string, outDir: string): Promise<TimelineAudio> {
  const audio: TimelineAudio = {};
  if (meta.bgm) {
    audio.bgm = { src: await copyAsset(join(dirname(scriptPath), meta.bgm), outDir, "bgm"), volume: meta.bgmVolume, duck: 0.35 };
  }
  if (meta.se === "default") {
    await mkdir(join(outDir, "public/se"), { recursive: true });
    await writeFile(join(outDir, "public/se/transition.wav"), chime());
    audio.se = { src: "se/transition.wav", volume: 0.5 };
  } else if (meta.se !== "none") {
    audio.se = { src: await copyAsset(join(dirname(scriptPath), meta.se), outDir, "se"), volume: 0.5 };
  }
  return audio;
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
