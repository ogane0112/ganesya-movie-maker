// F2: ナレーション文ごとに音声を作り（public/audio/*.wav）、秒数を audio-timing.json に書き出す。
// 同じ文・声・速度の音声はファイル名（ハッシュ）が同じなので作り直さない（F10の下地）。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AudioTiming, SceneDoc, SentenceAudio } from "../schema.js";
import { externalSynthesize, loadExternalVoice, type ExternalVoice } from "./external.js";
import { mouthFromWav, silentWav, wavSeconds } from "./wav.js";
import { mouthFromQuery, resolveVoicevoxSpeaker, voicevoxAvailable, voicevoxSynthesize } from "./voicevox.js";

export type TtsProvider = "auto" | "voicevox" | "silent";

export type TtsOptions = {
  provider: TtsProvider;
  voicevoxUrl: string;
  log?: (msg: string) => void;
  /** 本番の書き出し用。auto で VOICEVOX に繋がらないとき、無音で進めずにエラーにする */
  requireVoice?: boolean;
};

/**
 * 声の指定。「名前 key=値 …」で VOICEVOX の声の高さなどを変えられる（例: "zundamon pitch=0.05 speed=1.2"）。
 * exec:<名前> は外部の読み上げソフト（src/tts/external.ts）
 */
export type VoiceSpec = { name: string; pitch?: number; intonation?: number; speed?: number; volume?: number };

export function parseVoiceSpec(spec: string): VoiceSpec {
  const [name, ...rest] = spec.trim().split(/\s+/);
  const out: VoiceSpec = { name };
  for (const kv of rest) {
    const m = kv.match(/^(pitch|intonation|speed|volume)=(-?[\d.]+)$/);
    if (!m) throw new Error(`声の指定「${spec}」の ${kv} がわかりません（使えるのは pitch= intonation= speed= volume=）`);
    out[m[1] as "pitch"] = Number(m[2]);
  }
  return out;
}

type Voice = { kind: "voicevox"; id: number; name: string; spec: VoiceSpec } | { kind: "exec"; voice: ExternalVoice; name: string } | { kind: "silent"; spec: VoiceSpec };

export async function synthesizeAll(doc: SceneDoc, outDir: string, opts: TtsOptions): Promise<AudioTiming> {
  const log = opts.log ?? (() => {});
  // 掛け合いでは話者ごとに声が違う（speakers: 名前 → 声）。声ごとに一度だけ話者IDを調べる
  const voiceOf = (name?: string) => (name && doc.meta.speakers[name]) || doc.meta.voice;
  const specs = [...new Set(doc.scenes.flatMap((s) => s.sentences.map((x) => voiceOf(x.speaker))))];
  // 外部の読み上げソフトだけなら VOICEVOX は要らない
  const needsVoicevox = specs.some((v) => !v.startsWith("exec:"));
  let provider = opts.provider;
  if (provider === "auto") {
    provider = !needsVoicevox || (await voicevoxAvailable(opts.voicevoxUrl)) ? "voicevox" : "silent";
    if (provider === "silent" && opts.requireVoice) {
      throw new Error(
        `VOICEVOX（${opts.voicevoxUrl}）に接続できません。エンジンを起動してからやり直してください（無音のまま書き出すなら --tts silent）`,
      );
    }
    if (provider === "silent") {
      log(`VOICEVOX（${opts.voicevoxUrl}）に接続できないため、無音の仮音声（長さは文字数から推定）で進めます`);
    }
  }
  const voices = new Map<string, Voice>();
  for (const v of specs) {
    if (provider !== "silent" && v.startsWith("exec:")) {
      const name = v.slice(5);
      voices.set(v, { kind: "exec", voice: await loadExternalVoice(name), name });
      continue;
    }
    const spec = v.startsWith("exec:") ? { name: v } : parseVoiceSpec(v);
    voices.set(v, provider === "voicevox" ? { kind: "voicevox", ...(await resolveVoicevoxSpeaker(opts.voicevoxUrl, spec.name)), spec } : { kind: "silent", spec });
  }

  await mkdir(join(outDir, "public/audio"), { recursive: true });
  const sentences: SentenceAudio[] = [];
  let made = 0;
  for (const scene of doc.scenes) {
    for (const [index, sentence] of scene.sentences.entries()) {
      const { text } = sentence;
      const voice = voices.get(voiceOf(sentence.speaker))!;
      const speed = doc.meta.speed * (voice.kind === "exec" ? 1 : (voice.spec.speed ?? 1));
      const speech = applyReadings(sentence.speech ?? text, doc.meta.readings);
      const id = voice.kind === "voicevox" ? voice.id : voice.kind === "exec" ? `exec:${voice.name}:${JSON.stringify(voice.voice.command)}` : 0;
      const tweak = voice.kind === "exec" ? undefined : [voice.spec.pitch, voice.spec.intonation, voice.spec.volume];
      const key = createHash("sha1")
        .update(JSON.stringify([voice.kind === "exec" ? "exec" : provider, id, speed, speech, ...(tweak?.some((x) => x !== undefined) ? [tweak] : [])]))
        .digest("hex")
        .slice(0, 16);
      const file = `audio/${key}.wav`;
      const path = join(outDir, "public", file);
      const lipPath = path.replace(/\.wav$/, ".mouth.json");
      if (!existsSync(path) || !existsSync(lipPath)) {
        let wav: Buffer;
        let mouth: [number, number][];
        if (voice.kind === "voicevox") {
          const r = await voicevoxSynthesize(opts.voicevoxUrl, voice.id, speech, speed, voice.spec);
          wav = r.wav;
          mouth = mouthFromQuery(r.query, wavSeconds(wav));
        } else if (voice.kind === "exec") {
          wav = await externalSynthesize(voice.voice, speech);
          mouth = mouthFromWav(wav);
        } else {
          const seconds = estimateSeconds(speech, speed);
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
  log(`音声: ${sentences.length}文（新規 ${made} / キャッシュ ${sentences.length - made}）provider=${needsVoicevox ? provider : "exec"}`);
  const credits = [...voices.values()].flatMap((v) => (v.kind === "voicevox" ? [`VOICEVOX:${v.name}`] : v.kind === "exec" && v.voice.credit ? [v.voice.credit] : []));
  const timing: AudioTiming = { provider, voice: doc.meta.voice, credit: credits.length ? [...new Set(credits)].join("、") : undefined, sentences };
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
