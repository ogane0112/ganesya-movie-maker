// F2: ナレーション文ごとに音声を作り（public/audio/*.wav）、秒数を audio-timing.json に書き出す。
// 同じ文・声・速度の音声はファイル名（ハッシュ）が同じなので作り直さない（F10の下地）。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AudioTiming, SceneDoc, SentenceAudio } from "../schema.js";
import { silentWav, wavSeconds } from "./wav.js";
import { resolveVoicevoxSpeaker, voicevoxAvailable, voicevoxSynthesize } from "./voicevox.js";

export type TtsProvider = "auto" | "voicevox" | "silent";

export type TtsOptions = {
  provider: TtsProvider;
  voicevoxUrl: string;
  log?: (msg: string) => void;
};

export async function synthesizeAll(doc: SceneDoc, outDir: string, opts: TtsOptions): Promise<AudioTiming> {
  const log = opts.log ?? (() => {});
  let provider = opts.provider;
  if (provider === "auto") {
    provider = (await voicevoxAvailable(opts.voicevoxUrl)) ? "voicevox" : "silent";
    if (provider === "silent") {
      log(`VOICEVOX（${opts.voicevoxUrl}）に接続できないため、無音の仮音声（長さは文字数から推定）で進めます`);
    }
  }
  const speaker = provider === "voicevox" ? await resolveVoicevoxSpeaker(opts.voicevoxUrl, doc.meta.voice) : 0;

  await mkdir(join(outDir, "public/audio"), { recursive: true });
  const sentences: SentenceAudio[] = [];
  let made = 0;
  for (const scene of doc.scenes) {
    for (const [index, { text }] of scene.sentences.entries()) {
      const key = createHash("sha1")
        .update(JSON.stringify([provider, speaker, doc.meta.speed, text]))
        .digest("hex")
        .slice(0, 16);
      const file = `audio/${key}.wav`;
      const path = join(outDir, "public", file);
      if (!existsSync(path)) {
        const wav =
          provider === "voicevox"
            ? await voicevoxSynthesize(opts.voicevoxUrl, speaker, text, doc.meta.speed)
            : silentWav(estimateSeconds(text, doc.meta.speed));
        await writeFile(path, wav);
        made++;
      }
      sentences.push({ sceneId: scene.id, index, text, file, seconds: wavSeconds(await readFile(path)) });
    }
  }
  log(`音声: ${sentences.length}文（新規 ${made} / キャッシュ ${sentences.length - made}）provider=${provider}`);
  const timing: AudioTiming = { provider, voice: doc.meta.voice, sentences };
  await writeFile(join(outDir, "audio-timing.json"), JSON.stringify(timing, null, 2));
  return timing;
}

/** 仮音声用：日本語の読み上げはおよそ 1文字0.13秒（漢字は読みが長いので少し多め）。 */
export function estimateSeconds(text: string, speed = 1): number {
  let units = 0;
  for (const ch of text) {
    if (/[。、！？!?,.\s]/.test(ch)) units += 0.5;
    else if (/[一-鿿]/.test(ch)) units += 1.6;
    else if (/[A-Za-z0-9]/.test(ch)) units += 0.6;
    else units += 1;
  }
  return Math.max(0.8, (units * 0.13) / speed + 0.2);
}
