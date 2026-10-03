// F10: 音声トラックを Node で合成する（ナレーション + BGM + 効果音）。
// 音量や位置はプレビュー（remotion/Video.tsx・Sound.tsx）と同じ timeline と関数から決めるので、聞こえ方は同じになる。
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bgmVolumeAt, speechSpans } from "../remotion/Sound.js";
import { ffmpeg } from "./ffmpeg.js";
import type { Timeline } from "./schema.js";

export const MIX_RATE = 48000;

/** ステレオ・48kHz・float にデコードする */
async function decode(file: string, tmp: string): Promise<Float32Array> {
  const raw = join(tmp, "decode.f32");
  await ffmpeg(["-i", file, "-f", "f32le", "-ac", "2", "-ar", String(MIX_RATE), raw]);
  const buf = await readFile(raw);
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

export async function mixAudio(t: Timeline, outDir: string, output: string): Promise<void> {
  const fps = t.meta.fps;
  const tmp = join(outDir, ".segments/tmp");
  await mkdir(tmp, { recursive: true });
  const frames = t.durationInFrames;
  const length = Math.ceil((frames / fps) * MIX_RATE);
  const out = new Float32Array(length * 2);
  const pub = (src: string) => join(outDir, "public", src);
  const cache = new Map<string, Float32Array>();
  const load = async (src: string) => cache.get(src) ?? cache.set(src, await decode(pub(src), tmp)).get(src)!;

  /** clip を frame から gain(frame) の音量で足す（loop なら最後まで繰り返す） */
  const add = (clip: Float32Array, startFrame: number, gain: (frame: number) => number, maxFrames: number, loop = false) => {
    const start = Math.round((startFrame / fps) * MIX_RATE);
    const n = Math.min(loop ? Infinity : clip.length / 2, Math.round((maxFrames / fps) * MIX_RATE), length - start);
    for (let i = 0; i < n; i++) {
      const f = startFrame + (i / MIX_RATE) * fps;
      // フレーム間は音量を直線で補間する
      const g0 = gain(Math.floor(f));
      const g = g0 + (gain(Math.floor(f) + 1) - g0) * (f - Math.floor(f));
      const j = loop ? i % (clip.length / 2) : i;
      out[(start + i) * 2] += clip[j * 2] * g;
      out[(start + i) * 2 + 1] += clip[j * 2 + 1] * g;
    }
  };

  for (const scene of t.scenes) {
    for (const s of scene.sentences) {
      if (s.audio) add(await load(s.audio), scene.start + s.from, () => 1, scene.durationInFrames - s.from);
    }
  }
  const { bgm, se } = t.audio;
  if (se) for (const scene of t.scenes.slice(1)) add(await load(se.src), scene.start, () => se.volume, frames - scene.start);
  if (bgm) {
    const spans = speechSpans(t);
    add(await load(bgm.src), 0, (f) => bgmVolumeAt(f, t, spans), frames, true);
  }

  // 16bit WAV に書き出す
  const pcm = Buffer.alloc(out.length * 2);
  for (let i = 0; i < out.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i])) * 32767), i * 2);
  const raw = join(tmp, "mix.s16");
  await writeFile(raw, pcm);
  await ffmpeg(["-f", "s16le", "-ar", String(MIX_RATE), "-ac", "2", "-i", raw, output]);
  await rm(tmp, { recursive: true, force: true });
}
