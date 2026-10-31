// VOICEVOX の歌唱：楽譜（音符と歌詞）から歌声を作る。
// 音の高さと長さは歌唱用の「先生」の声（type: sing）で決め（sing_frame_audio_query）、声色は歌う人のスタイル（type: frame_decode）で出す（frame_synthesis）。
// フレーズごとに作って public/audio/ にキャッシュする（同じフレーズは作り直さない）。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SINGERS } from "./parse.js";
import type { Note } from "./schema.js";

/** VOICEVOX の歌唱の 1 フレーム（秒）。24000Hz の 256 サンプル */
export const SING_FPS = 24000 / 256;
/** フレーズの前後に置く休み（秒）。歌い出しの子音がフレーズの頭より前に来られるように */
export const SING_PAD = 0.12;

type SingerStyle = { name: string; styles: { name: string; id: number; type: string }[] };

/** 歌う人（"zundamon" / "zundamon:あまあま" / ID）→ 声色のスタイル ID と、高さを決める先生のスタイル ID */
export async function resolveSinger(url: string, spec: string): Promise<{ id: number; teacher: number; credit: string }> {
  const singers = (await (await fetch(`${url}/singers`)).json()) as SingerStyle[];
  const teacher = singers.flatMap((s) => s.styles).find((st) => st.type === "sing");
  if (!teacher) throw new Error("VOICEVOX に歌唱用の声（type: sing）がありません。VOICEVOX エンジン 0.16 以降を使ってください");
  const [who, style] = spec.split(":");
  const decode = (s: SingerStyle) => s.styles.filter((st) => st.type === "frame_decode");
  let hit: { singer: SingerStyle; id: number } | undefined;
  if (/^\d+$/.test(who)) {
    const singer = singers.find((s) => s.styles.some((st) => st.id === Number(who)));
    if (singer) hit = { singer, id: Number(who) };
  } else {
    const singer = singers.find((s) => s.name === (SINGERS[who] ?? who));
    const st = singer && (style ? decode(singer).find((x) => x.name === style) : decode(singer)[0]);
    if (singer && st) hit = { singer, id: st.id };
  }
  if (!hit) {
    const list = singers.filter((s) => decode(s).length).map((s) => `${s.name}（${decode(s).map((x) => x.name).join("・")}）`);
    throw new Error(`歌う声「${spec}」が見つかりません。使える声: ${Object.keys(SINGERS).join(" / ")}、または「名前:スタイル」。VOICEVOX の歌える声: ${list.join("、")}`);
  }
  return { id: hit.id, teacher: teacher.id, credit: `VOICEVOX:${hit.singer.name}` };
}

type Phoneme = { phoneme: string; frame_length: number };

/**
 * 1 フレーズを歌う。notes の長さは秒で渡す。返す wav はフレーズの頭より SING_PAD 秒前から始まる。
 * mouth はフレーズの頭からの秒（母音の間だけ開ける）
 */
export async function singPhrase(
  url: string,
  singer: { id: number; teacher: number },
  notes: { key: number | null; seconds: number; lyric: string }[],
  outDir: string,
): Promise<{ file: string; mouth: [number, number][] }> {
  // フレームの数は、丸めの誤差がたまらないよう累積の時刻から決める
  const score: { key: number | null; frame_length: number; lyric: string }[] = [{ key: null, frame_length: Math.round(SING_PAD * SING_FPS), lyric: "" }];
  let t = 0;
  let prev = 0;
  for (const nt of notes) {
    t += nt.seconds;
    const f = Math.round(t * SING_FPS);
    score.push({ key: nt.key, frame_length: Math.max(1, f - prev), lyric: nt.key === null ? "" : nt.lyric });
    prev = f;
  }
  score.push({ key: null, frame_length: Math.round(SING_PAD * SING_FPS), lyric: "" });
  // 休みが続くとエラーになるのでまとめる
  const merged: typeof score = [];
  for (const s of score) {
    const last = merged[merged.length - 1];
    if (last && last.key === null && s.key === null) last.frame_length += s.frame_length;
    else merged.push({ ...s });
  }
  const key = createHash("sha1").update(JSON.stringify([singer, merged])).digest("hex").slice(0, 16);
  const file = `audio/sing-${key}.wav`;
  const path = join(outDir, "public", file);
  const meta = path.replace(/\.wav$/, ".phonemes.json");
  if (!existsSync(path) || !existsSync(meta)) {
    const q = await fetch(`${url}/sing_frame_audio_query?speaker=${singer.teacher}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: merged }),
    });
    if (!q.ok) throw new Error(`VOICEVOX の歌唱（楽譜の解析）に失敗しました（${q.status}）: ${(await q.text()).slice(0, 200)}。歌詞: ${notes.map((n) => n.lyric).join("")}`);
    const query = await q.json();
    const s = await fetch(`${url}/frame_synthesis?speaker=${singer.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!s.ok) throw new Error(`VOICEVOX の歌唱（声の合成）に失敗しました（${s.status}）: ${(await s.text()).slice(0, 200)}`);
    await mkdir(join(outDir, "public/audio"), { recursive: true });
    await writeFile(path, Buffer.from(await s.arrayBuffer()));
    await writeFile(meta, JSON.stringify(query.phonemes));
  }
  const phonemes = JSON.parse(await readFile(meta, "utf8")) as Phoneme[];
  return { file, mouth: mouthFromPhonemes(phonemes, SING_PAD) };
}

/** 音素の長さから「口を開けている区間」（秒、フレーズの頭から）。母音の間を開とする */
export function mouthFromPhonemes(phonemes: Phoneme[], pad: number): [number, number][] {
  const spans: [number, number][] = [];
  let f = 0;
  for (const p of phonemes) {
    const a = f / SING_FPS - pad;
    f += p.frame_length;
    const b = f / SING_FPS - pad;
    if (!/^[aiueoAIUEO]$/.test(p.phoneme)) continue;
    const last = spans[spans.length - 1];
    // 続く母音の間は、一瞬だけ閉じて音の切れ目を見せる
    if (last && a - last[1] < 1e-6) last[1] = Math.max(last[0], a - 0.04);
    spans.push([Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000]);
  }
  return spans;
}
