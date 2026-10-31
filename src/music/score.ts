// 楽譜の部品：音名・コード・歌詞の音（モーラ）。曲の台本（layout: song）のパーサと伴奏・歌の合成で使う。

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 音名（C4 / F#3 / Bb4）→ MIDI の番号（C4 = 60）。わからなければ undefined */
export function noteToMidi(name: string): number | undefined {
  const m = name.match(/^([A-Ga-g])([#♯b♭]?)(-?\d)$/);
  if (!m) return undefined;
  const acc = m[2] === "#" || m[2] === "♯" ? 1 : m[2] === "b" || m[2] === "♭" ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + PITCH[m[1].toUpperCase()] + acc;
}

export function midiToName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** コードの種類 → 根音からの音程（半音） */
const QUALITY: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "7": [0, 4, 7, 10],
  M7: [0, 4, 7, 11],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  mM7: [0, 3, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  "7sus4": [0, 5, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  "9": [0, 4, 7, 10, 14],
};

export type Chord = {
  name: string;
  /** 根音（0〜11）と、ベースで弾く音（分数コードなら分母） */
  root: number;
  bass: number;
  /** 根音からの音程（半音） */
  intervals: number[];
};

/** コード名（C / Am / F#m7 / G7sus4 / C/E）を読む。わからなければエラー */
export function parseChord(name: string): Chord {
  const m = name.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/);
  const q = m ? QUALITY[m[3]] : undefined;
  if (!m || !q) throw new Error(`コード「${name}」がわかりません（例: C / Am / F#m7 / G7 / Csus4 / C/E。種類は ${Object.keys(QUALITY).filter(Boolean).join(" ")}）`);
  const pc = (l: string, a: string) => (PITCH[l] + (a === "#" ? 1 : a === "b" ? -1 : 0) + 12) % 12;
  const root = pc(m[1], m[2]);
  return { name, root, bass: m[4] ? pc(m[4], m[5]) : root, intervals: q };
}

const SMALL = "ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ";
const VOWEL_OF: Record<string, string> = {};
// 各かなの母音（ー をその前の音の母音にするため）
for (const [v, row] of Object.entries({
  あ: "あかさたなはまやらわがざだばぱゃぁアカサタナハマヤラワガザダバパャァ",
  い: "いきしちにひみりぎじぢびぴぃイキシチニヒミリギジヂビピィ",
  う: "うくすつぬふむゆるぐずづぶぷゅぅヴウクスツヌフムユルグズヅブプュゥ",
  え: "えけせてねへめれげぜでべぺぇエケセテネヘメレゲゼデベペェ",
  お: "おこそとのほもよろをごぞどぼぽょぉオコソトノホモヨロヲゴゾドボポョォ",
})) {
  for (const ch of row) VOWEL_OF[ch] = v;
}

/**
 * 歌詞をモーラ（1音符に1つ）に分ける。小さい「ゃゅょ」などは前の音にくっつけ、「っ」「ん」は1音。
 * 「ー」は前の音の母音（あいうえお）にする。空白と記号は無視する
 */
export function splitMora(lyrics: string): string[] {
  const out: string[] = [];
  for (const ch of lyrics.replace(/[\s、。，．,.!?！？「」『』…・〜~]/g, "")) {
    if (SMALL.includes(ch) && out.length && !/^[っッんンー]$/.test(out[out.length - 1])) out[out.length - 1] += ch;
    else if (ch === "ー" || ch === "－") {
      const prev = out[out.length - 1];
      out.push((prev && VOWEL_OF[prev[prev.length - 1]]) || "あ");
    } else out.push(ch);
  }
  return out;
}

export const isKana = (s: string) => /^[ぁ-ゖァ-ヺー]+$/.test(s);
