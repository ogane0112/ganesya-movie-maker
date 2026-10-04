// コードで合成する BGM と効果音。拍（bpm）に合わせて鳴るので、場面の切れ目が音のアタマに合う。
// 乱数は使わない（ノイズも決まった数列）。同じ指定なら毎回同じ波形になる。
//
//   bgm: synth:drive    明るく前に進む（4つ打ち・ベース・アルペジオ）。製品紹介・ショーリール
//   bgm: synth:tech     硬質でミニマル（キック・ハイハット・パルス）。技術紹介・データ
//   bgm: synth:epic     壮大（太鼓・低音・和音の厚い伸ばし）。歴史・3D の見せ場
//   bgm: synth:chill    落ち着いた（ゆるいビート・柔らかい和音）。解説・まとめ

export const SYNTH_PRESETS = ["drive", "tech", "epic", "chill"] as const;
export type SynthPreset = (typeof SYNTH_PRESETS)[number];

export const SYNTH_RATE = 44100;

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

const NOTE: Record<string, number> = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

type Style = {
  minor: boolean;
  /** 1小節ごとの和音（音階の度数, 0 始まり） */
  progression: number[];
  kick: (step: number) => boolean;
  snare: (step: number) => boolean;
  hat: (step: number) => number; // 音量（0 で鳴らさない）
  bass: (step: number) => boolean;
  arp: boolean;
  pad: number;
  swing: number;
  toms?: (step: number) => boolean;
};

const STYLES: Record<SynthPreset, Style> = {
  drive: {
    minor: false,
    progression: [0, 4, 5, 3], // I V vi IV
    kick: (s) => s % 4 === 0,
    snare: (s) => s % 8 === 4,
    hat: (s) => (s % 4 === 2 ? 0.9 : s % 2 === 1 ? 0.35 : 0),
    bass: (s) => s % 2 === 0 && s % 4 !== 0,
    arp: true,
    pad: 0.5,
    swing: 0,
  },
  tech: {
    minor: true,
    progression: [0, 0, 5, 6], // i i VI VII
    kick: (s) => s % 4 === 0,
    snare: (s) => s % 16 === 12,
    hat: (s) => (s % 2 === 1 ? 0.6 : 0.2),
    bass: (s) => s % 4 === 2 || s % 16 === 15,
    arp: true,
    pad: 0.25,
    swing: 0,
  },
  epic: {
    minor: true,
    progression: [0, 5, 2, 6], // i VI III VII
    kick: (s) => s % 16 === 0 || s % 16 === 10,
    snare: (s) => s % 16 === 8,
    hat: () => 0,
    bass: (s) => s % 8 === 0,
    arp: false,
    pad: 1,
    swing: 0,
    toms: (s) => s % 16 === 6 || s % 16 === 14 || s % 16 === 15,
  },
  chill: {
    minor: false,
    progression: [3, 2, 1, 4], // IV iii ii V
    kick: (s) => s % 16 === 0 || s % 16 === 7 || s % 16 === 10,
    snare: (s) => s % 8 === 4,
    hat: (s) => (s % 2 === 0 ? 0.4 : 0.2),
    bass: (s) => s % 8 === 0 || s % 16 === 11,
    arp: false,
    pad: 0.8,
    swing: 0.12,
  },
};

export type SynthOptions = { preset: SynthPreset; bpm: number; seconds: number; key?: string };

/** BGM を合成する（ステレオ・インターリーブの float） */
export function synthesizeMusic({ preset, bpm, seconds, key = "A" }: SynthOptions): Float32Array {
  const st = STYLES[preset];
  const rate = SYNTH_RATE;
  const total = Math.ceil((seconds + 1.5) * rate);
  const L = new Float32Array(total);
  const R = new Float32Array(total);
  const stepSec = 60 / bpm / 4; // 16分音符
  const steps = Math.ceil(seconds / stepSec);
  const root = 45 + (NOTE[key.toUpperCase()] ?? 9) - 9; // A2 を基準に
  const scale = st.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const degree = (d: number, oct = 0) => root + scale[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
  const chordOf = (bar: number) => {
    const d = st.progression[bar % st.progression.length];
    return [degree(d), degree(d + 2), degree(d + 4)];
  };
  const rnd = noise(0x9e3779b9);
  const totalBars = Math.ceil(steps / 16);

  const add = (buf: Float32Array, at: number, pcm: (t: number) => number, len: number, gain: number) => {
    const s0 = Math.round(at * rate);
    const n = Math.min(Math.round(len * rate), total - s0);
    for (let i = 0; i < n; i++) buf[s0 + i] += pcm(i / rate) * gain;
  };
  const both = (at: number, pcm: (t: number) => number, len: number, gain: number, pan = 0) => {
    add(L, at, pcm, len, gain * (1 - Math.max(0, pan)));
    add(R, at, pcm, len, gain * (1 + Math.min(0, pan)));
  };

  // 楽器
  const kick = (t: number) => Math.sin(2 * Math.PI * (45 * t + (110 / 18) * (1 - Math.exp(-18 * t)))) * Math.exp(-7 * t);
  const tom = (t: number) => Math.sin(2 * Math.PI * (70 * t + (60 / 10) * (1 - Math.exp(-10 * t)))) * Math.exp(-5 * t);
  const snare = () => {
    let lp = 0;
    return (t: number) => {
      const n = rnd();
      lp += 0.35 * (n - lp);
      return ((n - lp) * 0.8 + Math.sin(2 * Math.PI * 190 * t) * 0.5) * Math.exp(-16 * t);
    };
  };
  const hat = () => {
    let lp = 0;
    return (t: number) => {
      const n = rnd();
      lp += 0.6 * (n - lp);
      return (n - lp) * Math.exp(-70 * t);
    };
  };
  /** のこぎり波を一次のローパスに通した音（cut: 0〜1） */
  const saw = (f: number, cut: number, env: (t: number) => number, detune = 0) => {
    let lp = 0;
    return (t: number) => {
      const ph = (f * (1 + detune) * t) % 1;
      lp += cut * (2 * ph - 1 - lp);
      return lp * env(t);
    };
  };

  for (let step = 0; step < steps; step++) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const swing = s % 2 === 1 ? st.swing * stepSec : 0;
    const at = step * stepSec + swing;
    const intro = bar < 1 && totalBars > 4; // 最初の1小節はドラムを控えめに
    const outro = bar >= totalBars - 1 && totalBars > 4;
    const chord = chordOf(bar);

    if (st.kick(s) && !(intro && s !== 0)) both(at, kick, 0.5, 0.7);
    if (st.toms?.(s) && !intro) both(at, tom, 0.7, 0.6, s % 2 ? 0.3 : -0.3);
    if (st.snare(s) && !intro && !outro) both(at, snare(), 0.3, 0.35);
    const hv = st.hat(s);
    if (hv > 0 && !intro) both(at, hat(), 0.08, 0.16 * hv, 0.25);
    if (st.bass(s) || s === 0) {
      const f = hz(chord[0] - 12);
      both(at, saw(f, 0.08, (t) => Math.min(1, t / 0.005) * Math.exp(-4 * t)), stepSec * 2.5, 0.55);
    }
    if (st.arp && !intro) {
      const note = chord[[0, 1, 2, 1][s % 4]] + 12 * (s % 8 < 4 ? 1 : 2);
      const f = hz(note);
      both(at, (t) => (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1) * 0.5 * Math.exp(-14 * t), stepSec * 1.5, 0.1, s % 2 ? 0.5 : -0.5);
    }
    // 和音の伸ばし（小節の頭で鳴らし、小節いっぱい伸ばす）
    if (s === 0 && st.pad > 0) {
      const len = stepSec * 16;
      for (const [k, n] of chord.entries()) {
        const env = (t: number) => Math.min(1, t / 0.25) * Math.min(1, (len + 0.3 - t) / 0.4);
        for (const d of [-0.004, 0.004]) both(at, saw(hz(n + 12), 0.04, env, d), len + 0.3, 0.075 * st.pad, (k - 1) * 0.4 + d * 50);
      }
    }
  }

  // 最後は1秒で消す。音割れしないよう最大値を 0.9 に
  const fadeFrom = Math.round(seconds * rate);
  let peak = 0;
  for (let i = 0; i < total; i++) {
    const f = i < fadeFrom ? 1 : Math.max(0, 1 - (i - fadeFrom) / rate);
    L[i] *= f;
    R[i] *= f;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const g = peak > 0 ? 0.9 / peak : 1;
  const out = new Float32Array(total * 2);
  for (let i = 0; i < total; i++) {
    out[i * 2] = L[i] * g;
    out[i * 2 + 1] = R[i] * g;
  }
  return out;
}

/** 場面転換の「シュッ」（ノイズの帯域を上げていく） */
export function whoosh(): Float32Array {
  const rate = SYNTH_RATE;
  const len = 0.45;
  const n = Math.round(len * rate);
  const out = new Float32Array(n * 2);
  const rnd = noise(7);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const cut = 0.02 + 0.5 * (t / len);
    lp += cut * (rnd() - lp);
    const env = Math.sin(Math.PI * Math.min(1, t / len)) ** 2;
    out[i * 2] = lp * env * 0.9 * (1 - t / len);
    out[i * 2 + 1] = lp * env * 0.9 * (t / len);
  }
  return out;
}

/** 強い場面転換の「ドン」（低い音とノイズ） */
export function impact(): Float32Array {
  const rate = SYNTH_RATE;
  const n = Math.round(0.9 * rate);
  const out = new Float32Array(n * 2);
  const rnd = noise(11);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    lp += 0.1 * (rnd() - lp);
    const v = Math.sin(2 * Math.PI * (38 * t + (80 / 12) * (1 - Math.exp(-12 * t)))) * Math.exp(-4 * t) * 0.9 + lp * Math.exp(-9 * t) * 0.6;
    out[i * 2] = v;
    out[i * 2 + 1] = v;
  }
  return out;
}

/** ステレオ float → 16bit WAV */
export function toWav(pcm: Float32Array, rate = SYNTH_RATE): Buffer {
  const frames = pcm.length / 2;
  const buf = Buffer.alloc(44 + frames * 4);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + frames * 4, 4);
  buf.write("WAVEfmt ", 8, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < pcm.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcm[i])) * 32767), 44 + i * 2);
  return buf;
}
