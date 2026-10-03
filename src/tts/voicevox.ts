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

export async function resolveVoicevoxSpeaker(url: string, voice: string): Promise<number> {
  if (/^\d+$/.test(voice)) return Number(voice);
  const id = VOICEVOX_SPEAKERS[voice];
  if (id !== undefined) return id;
  // 日本語名（例: 「ずんだもん」）でも引けるようにする
  const res = await fetch(`${url}/speakers`);
  const speakers = (await res.json()) as { name: string; styles: { id: number }[] }[];
  const hit = speakers.find((s) => s.name === voice);
  if (!hit) {
    throw new Error(`VOICEVOX の話者「${voice}」が見つかりません。使える名前: ${Object.keys(VOICEVOX_SPEAKERS).join(", ")} または話者ID`);
  }
  return hit.styles[0].id;
}

export async function voicevoxSynthesize(url: string, speaker: number, text: string, speed: number): Promise<Buffer> {
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
  return Buffer.from(await s.arrayBuffer());
}
