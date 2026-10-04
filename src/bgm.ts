// BGM のカタログ（bgm/<提供元>.json）。台本に `bgm: maou:acoustic50` と書くと、
// カタログの曲を bgm/cache/ に取ってきて使う。カタログは `gmm bgm list` で一覧でき、
// エージェントはその説明（雰囲気・合う場面）を読んで曲を選ぶ。
// モーション動画では、曲のテンポと1小節目の頭（tempoOf）に場面の切れ目をそろえる。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ffmpeg, measureLoudness } from "./ffmpeg.js";
import { estimateTempo, TEMPO_RATE, type Tempo } from "./tempo.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const BGM_DIR = join(root, "bgm");
const CACHE = join(BGM_DIR, "cache");

const Track = z.object({
  id: z.string(),
  title: z.string().optional(),
  page: z.string(),
  tags: z.array(z.string()).default([]),
  description: z.string(),
  /** 解説動画での使いどころ */
  fit: z.string().optional(),
  /** 人が聴いて確かめたか */
  heard: z.boolean().default(false),
  /** テンポ（BPM）。書けば測った値より優先する（測り間違えた曲だけ書く） */
  bpm: z.number().positive().optional(),
  /** 曲の頭から最初の小節の頭までの秒数。書けば測った値より優先する */
  offset: z.number().min(0).optional(),
});
const Catalog = z.object({
  provider: z.string(),
  site: z.string(),
  credit: z.string(),
  terms: z.string(),
  note: z.string().optional(),
  tracks: z.array(Track),
});
export type BgmTrack = z.infer<typeof Track> & { catalog: string; provider: string; credit: string };

export async function loadCatalogs(): Promise<BgmTrack[]> {
  const out: BgmTrack[] = [];
  for (const name of (await readdir(BGM_DIR)).filter((f) => f.endsWith(".json")).sort()) {
    const catalog = name.replace(/\.json$/, "");
    const parsed = Catalog.safeParse(JSON.parse(await readFile(join(BGM_DIR, name), "utf8")));
    if (!parsed.success) throw new Error(`bgm/${name} が不正です: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
    for (const t of parsed.data.tracks) out.push({ ...t, catalog, provider: parsed.data.provider, credit: parsed.data.credit });
  }
  return out;
}

export const cachePath = (t: Pick<BgmTrack, "catalog" | "id">) => join(CACHE, t.catalog, `${t.id}.mp3`);

/** カタログの曲（"maou:acoustic50"）を探す */
export async function findTrack(spec: string): Promise<BgmTrack | undefined> {
  const m = spec.match(/^(\w+):([\w-]+)$/);
  if (!m) return undefined;
  const tracks = await loadCatalogs();
  const t = tracks.find((x) => x.catalog === m[1] && x.id === m[2]);
  if (!t) {
    const ids = tracks.filter((x) => x.catalog === m[1]).map((x) => x.id);
    throw new Error(`BGM「${spec}」はカタログにありません。gmm bgm list で探してください${ids.length ? `（${m[1]}: ${ids.join(", ")}）` : ""}`);
  }
  return t;
}

/** 曲のページから MP3 へのリンクを探す（ダウンロード URL の形を決め打ちしない） */
export function findMp3Link(html: string, page: string): string | undefined {
  const links = [...html.matchAll(/href=["']([^"']+\.mp3)(?:\?[^"']*)?["']/gi)].map((m) => new URL(m[1], page).href);
  return links[0];
}

/** カタログの曲を bgm/cache/ に取ってくる。取れなければ、手で置く場所を示してエラーにする */
export async function fetchTrack(t: BgmTrack): Promise<string> {
  const dest = cachePath(t);
  if (existsSync(dest)) return dest;
  const manual = `${t.page} から MP3 をダウンロードして ${dest} に置いてください`;
  let mp3: string | undefined;
  try {
    const res = await fetch(t.page, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mp3 = findMp3Link(await res.text(), t.page);
    if (!mp3) throw new Error("ページに MP3 のリンクが見つかりません");
    const audio = await fetch(mp3, { signal: AbortSignal.timeout(60000), headers: { Referer: t.page } });
    if (!audio.ok) throw new Error(`HTTP ${audio.status}`);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, Buffer.from(await audio.arrayBuffer()));
    return dest;
  } catch (e) {
    throw new Error(`BGM「${t.catalog}:${t.id}」を取得できませんでした（${(e as Error).cause ?? (e as Error).message}）。${manual}`);
  }
}

/** 測り方を変えたら上げる（保存した結果を使わずに測り直す） */
const TEMPO_VERSION = 1;

/** 曲のテンポと1小節目の頭。測った結果は bgm/cache/.tempo/ に保存して使い回す */
export async function tempoOf(file: string): Promise<Tempo> {
  const key = createHash("sha1").update(`v${TEMPO_VERSION}:`).update(await readFile(file)).digest("hex").slice(0, 16);
  const memo = join(CACHE, ".tempo", `${key}.json`);
  if (existsSync(memo)) return JSON.parse(await readFile(memo, "utf8"));
  const raw = join(CACHE, ".tempo", `${key}.f32`);
  await mkdir(dirname(raw), { recursive: true });
  await ffmpeg(["-i", file, "-vn", "-f", "f32le", "-ac", "1", "-ar", String(TEMPO_RATE), raw]);
  const buf = await readFile(raw);
  await rm(raw, { force: true });
  const r = estimateTempo(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
  await writeFile(memo, JSON.stringify(r));
  return r;
}

/**
 * 音の大きさ（LUFS）と長さ。測った結果は bgm/cache/.loudness/ に保存して使い回す。
 * 鍵は中身のハッシュ。大きな録画（byStat）は読み切らずに、パス・大きさ・更新時刻を鍵にする
 */
export async function loudnessOf(file: string, opts: { byStat?: boolean } = {}): Promise<{ lufs: number; seconds: number }> {
  const s = await stat(file);
  const key = createHash("sha1")
    .update(opts.byStat ? `${resolve(file)}:${s.size}:${s.mtimeMs}` : await readFile(file))
    .digest("hex")
    .slice(0, 16);
  const memo = join(CACHE, ".loudness", `${key}.json`);
  if (existsSync(memo)) return JSON.parse(await readFile(memo, "utf8"));
  const r = await measureLoudness(file);
  await mkdir(dirname(memo), { recursive: true });
  await writeFile(memo, JSON.stringify(r));
  return r;
}
