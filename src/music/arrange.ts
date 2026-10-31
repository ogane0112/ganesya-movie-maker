// 伴奏の合成。セクションのコードと盛り上がり（energy）と伴奏の型（music:）から、ドラム・ベース・和音・アルペジオを鳴らす。
// 乱数は使わない（ノイズも決まった数列）。同じ曲なら毎回同じ波形になる。
import { hz, parseChord } from "./score.js";
import type { Arrangement, Energy, SongSection } from "./schema.js";

export const MUSIC_RATE = 44100;

/** 決まった数列のノイズ（-1〜1） */
function noise(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

type Pattern = {
  kick: number[];
  snare: number[];
  /** ハイハット（16 分の位置 → 音量） */
  hat: Record<number, number>;
  openHat?: number[];
  /** ベースを鳴らす 16 分の位置 */
  bass: number[];
  /** 和音を鳴らす位置（piano / guitar / chip） */
  comp: number[];
};

/** 型ごと・盛り上がりごとのリズム（16 分音符 16 個で 1 小節） */
const range = (from: number, step: number) => Array.from({ length: Math.ceil((16 - from) / step) }, (_, i) => from + i * step);
const eights = range(0, 2);
const PATTERNS: Record<Arrangement, Record<Energy, Pattern>> = {
  pop: {
    low: { kick: [], snare: [], hat: {}, bass: [0], comp: [0, 8] },
    mid: { kick: [0, 8], snare: [4, 12], hat: { 0: 0.5, 4: 0.5, 8: 0.5, 12: 0.5, 2: 0.3, 6: 0.3, 10: 0.3, 14: 0.3 }, bass: [0, 6, 8, 14], comp: [0, 6, 10] },
    high: { kick: [0, 8, 10], snare: [4, 12], hat: Object.fromEntries(eights.map((s) => [s, s % 4 ? 0.45 : 0.8])), openHat: [14], bass: eights, comp: [0, 3, 6, 10, 12] },
  },
  rock: {
    low: { kick: [], snare: [], hat: {}, bass: [0], comp: [0, 4, 8, 12] },
    mid: { kick: [0, 6, 8], snare: [4, 12], hat: Object.fromEntries(eights.map((s) => [s, 0.5])), bass: eights, comp: eights },
    high: { kick: [0, 6, 8, 10], snare: [4, 12], hat: Object.fromEntries(eights.map((s) => [s, 0.8])), bass: eights, comp: eights },
  },
  ballad: {
    low: { kick: [], snare: [], hat: {}, bass: [0], comp: eights },
    mid: { kick: [0, 10], snare: [8], hat: Object.fromEntries(eights.map((s) => [s, 0.3])), bass: [0, 8], comp: eights },
    high: { kick: [0, 6, 10], snare: [4, 12], hat: Object.fromEntries(eights.map((s) => [s, 0.45])), bass: [0, 6, 8], comp: eights },
  },
  chiptune: {
    low: { kick: [], snare: [], hat: {}, bass: [0, 8], comp: range(0, 1) },
    mid: { kick: [0, 8], snare: [4, 12], hat: Object.fromEntries(eights.map((s) => [s + 1, 0.4])), bass: eights, comp: range(0, 1) },
    high: { kick: [0, 3, 8, 11], snare: [4, 12], hat: Object.fromEntries(range(0, 1).map((s) => [s, s % 2 ? 0.3 : 0.6])), bass: eights, comp: range(0, 1) },
  },
  edm: {
    low: { kick: [], snare: [], hat: {}, bass: [], comp: [0, 3, 6, 10, 12] },
    mid: { kick: [0, 4, 8, 12], snare: [], hat: { 2: 0.5, 6: 0.5, 10: 0.5, 14: 0.5 }, bass: [2, 6, 10, 14], comp: [0, 3, 6, 10, 12] },
    high: { kick: [0, 4, 8, 12], snare: [4, 12], hat: { 2: 0.7, 6: 0.7, 10: 0.7, 14: 0.7 }, openHat: [2, 6, 10, 14], bass: [2, 3, 6, 7, 10, 11, 14, 15], comp: [0, 3, 6, 10, 12] },
  },
};

export type ArrangeInput = {
  bpm: number;
  music: Arrangement;
  transpose: number;
  sections: SongSection[];
  /** 楽器でメロディを弾く（歌がないとき） */
  lead?: boolean;
};

/** 小節の長さ（秒）と、各セクションの頭（秒） */
export function songTimes(bpm: number, sections: { bars: number }[]): { barSec: number; starts: number[]; total: number } {
  const barSec = (60 / bpm) * 4;
  const starts: number[] = [];
  let t = 0;
  for (const s of sections) starts.push(t), (t += s.bars * barSec);
  return { barSec, starts, total: t };
}

/** 伴奏を合成する（ステレオ・インターリーブの float、MUSIC_RATE） */
export function arrange(input: ArrangeInput, tailSec = 2): Float32Array {
  const { bpm, music, sections } = input;
  const rate = MUSIC_RATE;
  const { barSec, starts, total } = songTimes(bpm, sections);
  const n = Math.ceil((total + tailSec) * rate);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  // EDM の和音は別の入れ物に入れ、キックに合わせて音量を下げる（サイドチェイン）
  const PL = new Float32Array(n);
  const PR = new Float32Array(n);
  const rnd = noise(0x1234567);
  const step = barSec / 16;

  const add = (l: Float32Array, r: Float32Array, at: number, len: number, f: (t: number) => number, gain: number, pan = 0) => {
    const s0 = Math.max(0, Math.round(at * rate));
    const m = Math.min(Math.round(len * rate), n - s0);
    const gl = gain * Math.min(1, 1 - pan);
    const gr = gain * Math.min(1, 1 + pan);
    for (let i = 0; i < m; i++) {
      const v = f(i / rate);
      l[s0 + i] += v * gl;
      r[s0 + i] += v * gr;
    }
  };
  const put = (at: number, len: number, f: (t: number) => number, gain: number, pan = 0) => add(L, R, at, len, f, gain, pan);
  const chip = music === "chiptune";

  // ---- 楽器 ----
  const kick = (t: number) => Math.sin(2 * Math.PI * (48 * t + (120 / 20) * (1 - Math.exp(-20 * t)))) * Math.exp(-6 * t);
  const noiseHit = (decay: number, hp: number) => {
    let lp = 0;
    return (t: number) => {
      const x = rnd();
      lp += hp * (x - lp);
      return (x - lp) * Math.exp(-decay * t);
    };
  };
  const snare = (t: number, f = noiseHit(18, 0.3)) => f(t) * 0.9 + Math.sin(2 * Math.PI * 185 * t) * Math.exp(-20 * t) * 0.5;
  const sawLp = (f: number, cut: number, env: (t: number) => number, detune = 0) => {
    let lp = 0;
    return (t: number) => {
      const ph = (f * (1 + detune) * t) % 1;
      lp += cut * (2 * ph - 1 - lp);
      return lp * env(t);
    };
  };
  const square = (f: number, env: (t: number) => number, duty = 0.5) => (t: number) => ((f * t) % 1 < duty ? 0.5 : -0.5) * env(t);
  /** ピアノっぽい音（倍音の減衰が速い） */
  const piano = (f: number) => (t: number) =>
    (Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(4 * Math.PI * f * t) * Math.exp(-3 * t) + 0.2 * Math.sin(6 * Math.PI * f * t) * Math.exp(-6 * t)) *
    Math.min(1, t / 0.004) *
    Math.exp(-2.2 * t);
  /** 歪んだギターのパワーコード */
  const guitar = (f: number, mute: boolean) => {
    const a = sawLp(f, 0.18, () => 1);
    const b = sawLp(f * 1.4983, 0.18, () => 1, 0.002);
    return (t: number) => Math.tanh((a(t) + b(t)) * 4) * Math.min(1, t / 0.003) * Math.exp(-(mute ? 14 : 2.5) * t);
  };

  sections.forEach((sec, si) => {
    const pat = PATTERNS[music][sec.energy];
    const nextHigh = sections[si + 1]?.energy === "high";
    const t0 = starts[si];
    for (let bar = 0; bar < sec.bars; bar++) {
      const chordSpec = sec.chords[bar % sec.chords.length].split(",");
      const lastBar = bar === sec.bars - 1;
      for (let s = 0; s < 16; s++) {
        const at = t0 + bar * barSec + s * step;
        const chord = parseChord(chordSpec[Math.min(chordSpec.length - 1, Math.floor((s / 16) * chordSpec.length))]);
        const root = chord.root + input.transpose;
        const tones = chord.intervals.map((iv) => 60 + ((root % 12) + 12) % 12 + iv);
        const bassNote = 36 + (((chord.bass + input.transpose) % 12) + 12) % 12;
        const fill = lastBar && nextHigh && s >= 12 && sec.energy !== "low";

        // ドラム
        if (pat.kick.includes(s)) put(at, 0.5, chip ? (t) => Math.sin(2 * Math.PI * (60 - 40 * Math.min(1, t * 12)) * t) * Math.exp(-12 * t) : kick, chip ? 0.6 : 0.85);
        if (pat.snare.includes(s) || fill) put(at, 0.3, chip ? noiseHit(22, 0.9) : (t) => snare(t), fill ? 0.25 + (s - 12) * 0.05 : 0.38, -0.05);
        if (pat.hat[s]) put(at, 0.07, noiseHit(chip ? 90 : 75, 0.75), 0.13 * pat.hat[s], 0.3);
        if (pat.openHat?.includes(s)) put(at, 0.3, noiseHit(12, 0.8), 0.07, 0.3);
        if (sec.energy === "high" && bar === 0 && s === 0 && !chip) put(at, 2, noiseHit(1.6, 0.85), 0.16, -0.2); // シンバル

        // ベース
        if (pat.bass.includes(s)) {
          const oct = music === "chiptune" && s % 4 === 2 ? 12 : 0;
          const len = sec.energy === "low" ? barSec * 0.9 : step * 1.8;
          const env = (t: number) => Math.min(1, t / 0.004) * Math.exp(-(sec.energy === "low" ? 1.5 : 5) * t);
          put(at, len, chip ? square(hz(bassNote + oct), env, 0.5) : sawLp(hz(bassNote + oct), 0.07, env), chip ? 0.22 : 0.6);
        }

        // 和音
        if (pat.comp.includes(s)) {
          if (music === "rock" && sec.energy !== "low") {
            put(at, step * 2, guitar(hz(bassNote + 12), sec.energy === "mid"), 0.11, s % 4 ? 0.35 : -0.35);
          } else if (chip) {
            const k = tones[s % tones.length] + (s % 8 >= 4 ? 12 : 0);
            put(at, step * 0.9, square(hz(k), (t) => Math.exp(-8 * t), 0.25), 0.07, s % 2 ? 0.3 : -0.3);
          } else if (music === "ballad" || (music === "rock" && sec.energy === "low")) {
            // アルペジオ：根音・5度・オクターブ・3度…
            const order = [0, 2, 1, 2, 0, 2, 1, 2];
            const k = (tones[order[(s / 2) % 8]] ?? tones[0]) + (s >= 8 && order[(s / 2) % 8] === 0 ? 12 : 0);
            put(at, barSec * 0.6, piano(hz(k)), 0.12, ((s / 2) % 3) * 0.25 - 0.25);
          } else if (music === "edm") {
            for (const [k, tn] of tones.entries()) put(at, step * 1.6, sawLp(hz(tn + 12), 0.25, (t) => Math.exp(-7 * t)), 0.05, (k - 1) * 0.3);
          } else {
            for (const [k, tn] of tones.entries()) put(at, step * 3, piano(hz(tn)), 0.075, (k - 1) * 0.25);
          }
        }

        // 伸ばし（小節の頭）
        if (s === 0 && (music === "ballad" || music === "edm" || sec.energy === "high" || sec.energy === "low") && !chip) {
          const len = barSec + 0.2;
          const env = (t: number) => Math.min(1, t / 0.2) * Math.min(1, (len - t) / 0.25);
          const g = music === "edm" ? 0.05 : 0.035;
          for (const [k, tn] of tones.entries()) {
            for (const d of [-0.003, 0.003]) add(PL, PR, at, len, sawLp(hz(tn), 0.05, env, d), g, (k - 1) * 0.35 + d * 60);
          }
        }
        // アルペジオ（明るい曲のサビ）
        if ((music === "pop" || music === "edm") && sec.energy === "high") {
          const k = tones[[0, 1, 2, 1][s % 4]] + 24;
          put(at, step * 1.2, square(hz(k), (t) => Math.exp(-16 * t), 0.3), 0.025, s % 2 ? 0.5 : -0.5);
        }
      }
    }
  });

  // メロディを楽器で弾く（歌がないとき）
  if (input.lead) {
    sections.forEach((sec, si) => {
      for (const ph of sec.phrases) {
        let pos = ph.at;
        for (const nt of ph.notes) {
          const at = starts[si] + (pos / sec.grid) * barSec;
          const len = (nt.steps / sec.grid) * barSec;
          pos += nt.steps;
          if (nt.key === null) continue;
          const f = hz(nt.key);
          const env = (t: number) => Math.min(1, t / 0.01) * Math.min(1, (len - t) / 0.03 + 0.001) * (0.8 + 0.2 * Math.exp(-4 * t));
          const vib = (t: number) => 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t / 0.3);
          put(at, len, chip ? square(f, env, 0.25) : (t) => (Math.sin(2 * Math.PI * f * t * vib(t)) * 0.7 + (((f * t * vib(t)) % 1) * 2 - 1) * 0.3) * env(t), chip ? 0.18 : 0.22);
        }
      }
    });
  }

  // EDM のサイドチェイン：キックのたびに伸ばしの音量を下げる
  const kicks: number[] = [];
  sections.forEach((sec, si) => {
    for (let bar = 0; bar < sec.bars; bar++) for (const s of PATTERNS[music][sec.energy].kick) kicks.push(starts[si] + bar * barSec + s * step);
  });
  let ki = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    while (ki + 1 < kicks.length && kicks[ki + 1] <= t) ki++;
    const since = kicks.length && kicks[ki] <= t ? t - kicks[ki] : 10;
    const duck = music === "edm" ? 1 - 0.7 * Math.exp(-since * 9) : 1;
    L[i] += PL[i] * duck;
    R[i] += PR[i] * duck;
  }
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) (out[i * 2] = L[i]), (out[i * 2 + 1] = R[i]);
  return out;
}
