// VOICEVOX エンジン（ローカルHTTP API）クライアント
// 利用規約・クレジット表記はキャラごとに異なる。README の「権利」を参照。

/** 台本の voice に書ける名前 → 話者ID（ノーマル）。数字をそのまま書いてもよい。 */
export const VOICEVOX_SPEAKERS: Record<string, number> = {
  zundamon: 3,
  metan: 2,
  tsumugi: 8,
  hau: 10,
  ritsu: 9,
  takehiro: 11,
  kotaro: 12,
  ryusei: 13,
};

export async function voicevoxAvailable(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/version`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** 話者IDと、クレジット表記用の日本語名（例: ずんだもん）を返す */
export async function resolveVoicevoxSpeaker(url: string, voice: string): Promise<{ id: number; name: string }> {
  const res = await fetch(`${url}/speakers`);
  const speakers = (await res.json()) as { name: string; styles: { id: number }[] }[];
  const byId = (id: number) => speakers.find((s) => s.styles.some((st) => st.id === id));
  const id = /^\d+$/.test(voice) ? Number(voice) : (VOICEVOX_SPEAKERS[voice] ?? speakers.find((s) => s.name === voice)?.styles[0].id);
  const hit = id === undefined ? undefined : byId(id);
  if (id === undefined || !hit) {
    throw new Error(`VOICEVOX の話者「${voice}」が見つかりません。使える名前: ${Object.keys(VOICEVOX_SPEAKERS).join(", ")} / 日本語の話者名 / 話者ID`);
  }
  return { id, name: hit.name };
}

type Mora = { consonant_length: number | null; vowel: string; vowel_length: number };
type AudioQuery = {
  speedScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  pauseLengthScale?: number;
  accent_phrases: { moras: Mora[]; pause_mora: Mora | null }[];
};

/**
 * 音素の長さから「口を開けている区間」を出す。母音の間を開、子音・撥音・促音・無音を閉とする。
 * 速度を変えると予測と実際の長さが少しずれるので、最後に実際の音声の長さに合わせて伸縮する。
 */
export function mouthFromQuery(q: AudioQuery, actualSeconds: number): [number, number][] {
  const spans: [number, number][] = [];
  let t = q.prePhonemeLength;
  for (const ap of q.accent_phrases) {
    for (const m of ap.moras) {
      t += m.consonant_length ?? 0;
      const open = !["N", "cl", "pau"].includes(m.vowel);
      if (open) spans.push([t, t + m.vowel_length]);
      t += m.vowel_length;
    }
    if (ap.pause_mora) t += ap.pause_mora.vowel_length * (q.pauseLengthScale ?? 1);
  }
  const predicted = (t + q.postPhonemeLength) / q.speedScale;
  const scale = actualSeconds / predicted / q.speedScale;
  return spans.map(([a, b]) => [round(a * scale), round(b * scale)]);
}

const round = (x: number) => Math.round(x * 1000) / 1000;

export async function voicevoxSynthesize(
  url: string,
  speaker: number,
  text: string,
  speed: number,
): Promise<{ wav: Buffer; query: AudioQuery }> {
  const q = await fetch(`${url}/audio_query?${new URLSearchParams({ text, speaker: String(speaker) })}`, {
    method: "POST",
  });
  if (!q.ok) throw new Error(`VOICEVOX audio_query 失敗 (${q.status}): ${await q.text()}`);
  const query = await q.json();
  query.speedScale = speed;
  // 文と文の間はタイムライン側で空けるので、前後の無音は短くする
  query.prePhonemeLength = 0.05;
  query.postPhonemeLength = 0.05;
  const s = await fetch(`${url}/synthesis?speaker=${speaker}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!s.ok) throw new Error(`VOICEVOX synthesis 失敗 (${s.status}): ${await s.text()}`);
  return { wav: Buffer.from(await s.arrayBuffer()), query };
}
