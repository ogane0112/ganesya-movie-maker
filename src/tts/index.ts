// F2: ナレーション文ごとに音声を作り（public/audio/*.wav）、秒数を audio-timing.json に書き出す。
// 同じ文・声・速度の音声はファイル名（ハッシュ）が同じなので作り直さない（F10の下地）。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AudioTiming, SceneDoc, SentenceAudio } from "../schema.js";
import { silentWav, wavSeconds } from "./wav.js";
import { mouthFromQuery, resolveVoicevoxSpeaker, voicevoxAvailable, voicevoxSynthesize } from "./voicevox.js";

export type TtsProvider = "auto" | "voicevox" | "silent";

export type TtsOptions = {
  provider: TtsProvider;
  voicevoxUrl: string;
  log?: (msg: string) => void;
  /** 本番の書き出し用。auto で VOICEVOX に繋がらないとき、無音で進めずにエラーにする */
  requireVoice?: boolean;
};

export async function synthesizeAll(doc: SceneDoc, outDir: string, opts: TtsOptions): Promise<AudioTiming> {
  const log = opts.log ?? (() => {});
  let provider = opts.provider;
  if (provider === "auto") {
    provider = (await voicevoxAvailable(opts.voicevoxUrl)) ? "voicevox" : "silent";
    if (provider === "silent" && opts.requireVoice) {
      throw new Error(
        `VOICEVOX（${opts.voicevoxUrl}）に接続できません。エンジンを起動してからやり直してください（無音のまま書き出すなら --tts silent）`,
      );
    }
    if (provider === "silent") {
      log(`VOICEVOX（${opts.voicevoxUrl}）に接続できないため、無音の仮音声（長さは文字数から推定）で進めます`);
    }
  }
  const vv = provider === "voicevox" ? await resolveVoicevoxSpeaker(opts.voicevoxUrl, doc.meta.voice) : undefined;
  const speaker = vv?.id ?? 0;

  await mkdir(join(outDir, "public/audio"), { recursive: true });
  const sentences: SentenceAudio[] = [];
  let made = 0;
  for (const scene of doc.scenes) {
    for (const [index, sentence] of scene.sentences.entries()) {
      const { text } = sentence;
      const speech = applyReadings(sentence.speech ?? text, doc.meta.readings);
      const key = createHash("sha1")
        .update(JSON.stringify([provider, speaker, doc.meta.speed, speech]))
        .digest("hex")
        .slice(0, 16);
      const file = `audio/${key}.wav`;
      const path = join(outDir, "public", file);
      const lipPath = path.replace(/\.wav$/, ".mouth.json");
      if (!existsSync(path) || !existsSync(lipPath)) {
        let wav: Buffer;
        let mouth: [number, number][];
        if (provider === "voicevox") {
          const r = await voicevoxSynthesize(opts.voicevoxUrl, speaker, speech, doc.meta.speed);
          wav = r.wav;
          mouth = mouthFromQuery(r.query, wavSeconds(wav));
        } else {
          const seconds = estimateSeconds(speech, doc.meta.speed);
          wav = silentWav(seconds);
          mouth = estimateMouth(seconds);
        }
        await writeFile(path, wav);
        await writeFile(lipPath, JSON.stringify(mouth));
        made++;
      }
      sentences.push({
        sceneId: scene.id,
        index,
        text,
        file,
        seconds: wavSeconds(await readFile(path)),
        mouth: JSON.parse(await readFile(lipPath, "utf8")),
      });
    }
  }
  log(`音声: ${sentences.length}文（新規 ${made} / キャッシュ ${sentences.length - made}）provider=${provider}`);
  const timing: AudioTiming = { provider, voice: doc.meta.voice, credit: vv && `VOICEVOX:${vv.name}`, sentences };
  await writeFile(join(outDir, "audio-timing.json"), JSON.stringify(timing, null, 2));
  return timing;
}

/** 読みの辞書を適用する。長い表記から順に置き換える（「S3」より「S3バケット」を優先） */
export function applyReadings(text: string, readings: Record<string, string>): string {
  const keys = Object.keys(readings).sort((a, b) => b.length - a.length);
  if (!keys.length) return text;
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  return text.replace(re, (m) => readings[m]);
}

/** 仮音声用の口パク：0.16秒ごとに開け閉めする */
export function estimateMouth(seconds: number): [number, number][] {
  const out: [number, number][] = [];
  for (let t = 0.1; t + 0.1 < seconds - 0.1; t += 0.16) out.push([Math.round(t * 1000) / 1000, Math.round((t + 0.1) * 1000) / 1000]);
  return out;
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
