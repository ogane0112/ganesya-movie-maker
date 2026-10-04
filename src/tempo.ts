// 曲のテンポ（BPM）と1小節目の頭の位置を測る。モーション動画で魔王魂などの曲を使うとき、
// 場面の切れ目を曲の拍にそろえるために使う。乱数は使わないので、同じ曲なら必ず同じ結果になる。
//
//   1. 音の立ち上がり（オンセット）の強さを 100 回/秒で求める（低音＝キック と 全体 の2帯域）
//   2. 自己相関で拍の間隔の候補を選ぶ（120 BPM あたりを好む。半分・倍のテンポに間違えにくくする）
//   3. その近くを細かく動かし、拍の位置にオンセットが最も集まるテンポと位置（位相）を選ぶ
//   4. 4拍とその裏のうち、毎小節で最も強く鳴る所（低音を重く数える）を小節の頭とする

/** 解析に使う標本化周波数とオンセットの間隔 */
export const TEMPO_RATE = 11025;
const HOP = 110; // 約 100 回/秒
const ENV_RATE = TEMPO_RATE / HOP;

export type Tempo = {
  bpm: number;
  /** 曲の頭から、最初の小節の頭までの秒数（0 〜 1小節） */
  offset: number;
  /** 拍のはっきりさ（0〜1）。0.3 未満なら拍が取りにくい曲 */
  confidence: number;
};

/** 片方向の1次ローパス（cutoff Hz） */
function lowpass(x: Float32Array, cutoff: number): Float32Array {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / TEMPO_RATE);
  const y = new Float32Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) y[i] = s += a * (x[i] - s);
  return y;
}

/** 音の立ち上がりの強さ（HOP ごと）。音量の対数の増え分だけを足し、ゆっくりした変化は引く。low は低音だけのもの */
function onsetEnvelope(x: Float32Array): { env: Float32Array; low: Float32Array } {
  const n = Math.floor(x.length / HOP);
  const logEnergy = (sig: Float32Array) => {
    const e = new Float32Array(n);
    for (let f = 0; f < n; f++) {
      let s = 0;
      for (let i = f * HOP; i < (f + 1) * HOP; i++) s += sig[i] * sig[i];
      e[f] = Math.log(1 + 1000 * (s / HOP));
    }
    return e;
  };
  const rise = (e: Float32Array) => {
    const d = new Float32Array(n);
    for (let f = 1; f < n; f++) d[f] = Math.max(0, e[f] - e[f - 1]);
    // 0.5 秒の移動平均を引いて、にぎやかな区間と静かな区間の差をならす
    const w = Math.round(ENV_RATE / 2);
    const out = new Float32Array(n);
    let sum = 0;
    for (let f = 0; f < n; f++) {
      sum += d[f] - (f >= w ? d[f - w] : 0);
      out[f] = Math.max(0, d[f] - sum / Math.min(f + 1, w));
    }
    return out;
  };
  const low = rise(logEnergy(lowpass(lowpass(lowpass(x, 120), 120), 120)));
  const all = rise(logEnergy(x));
  const env = new Float32Array(n);
  for (let f = 0; f < n; f++) env[f] = low[f] + all[f];
  return { env, low };
}

/** 線形補間で env の位置 p（小数）の値 */
const at = (env: Float32Array, p: number) => {
  const i = Math.floor(p);
  if (i < 0 || i + 1 >= env.length) return 0;
  return env[i] + (env[i + 1] - env[i]) * (p - i);
};

/** 間隔 period（env の単位）で並べた拍に乗るオンセットの平均が最大になる位相と、その値 */
function bestPhase(env: Float32Array, period: number): { phase: number; score: number } {
  let best = { phase: 0, score: -1 };
  const beats = Math.floor((env.length - 1) / period);
  for (let ph = 0; ph < period; ph += 0.5) {
    let s = 0;
    for (let k = 0; k < beats; k++) s += at(env, ph + k * period);
    if (s > best.score) best = { phase: ph, score: s };
  }
  return { phase: best.phase, score: best.score / Math.max(1, beats) };
}

/** モノラル・TEMPO_RATE の音声からテンポを測る。range: 探す BPM の範囲 */
export function estimateTempo(samples: Float32Array, range: [number, number] = [60, 200]): Tempo {
  const { env, low } = onsetEnvelope(samples);
  const mean = env.reduce((a, b) => a + b, 0) / Math.max(1, env.length);
  if (env.length < ENV_RATE * 4 || mean === 0) return { bpm: 120, offset: 0, confidence: 0 };

  // 2. 自己相関。本当の拍なら 2拍・3拍・4拍先にも山があるので、それも足して選ぶ。
  //    さらに 120 BPM を中心に、1オクターブで弱まる重みをかける
  const minLag = Math.floor((60 / range[1]) * ENV_RATE);
  const maxLag = Math.ceil((60 / range[0]) * ENV_RATE);
  const centered = env.map((v) => v - mean);
  let energy = 0;
  for (const v of centered) energy += v * v;
  const acCache = new Map<number, number>();
  const ac = (lag: number) => {
    const l = Math.round(lag);
    if (acCache.has(l)) return acCache.get(l)!;
    let s = 0;
    for (let i = 0; i + l < centered.length; i++) s += centered[i] * centered[i + l];
    // 少しのずれ（揺れ・スウィング）は許す
    acCache.set(l, s / energy);
    return s / energy;
  };
  const near = (lag: number) => Math.max(ac(lag - 1), ac(lag), ac(lag + 1));
  let bestLag = minLag;
  let bestScore = -Infinity;
  let bestAc = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const pulse = (near(lag) + near(2 * lag) + near(3 * lag) + near(4 * lag)) / 4;
    const bpm = (60 * ENV_RATE) / lag;
    const weight = Math.exp(-0.5 * Math.log2(bpm / 120) ** 2);
    if (pulse * weight > bestScore) {
      bestScore = pulse * weight;
      bestLag = lag;
      bestAc = pulse;
    }
  }

  // 3. 候補の ±3% を 0.02 BPM 刻みで調べ、拍の位置にオンセットが最も集まるものを選ぶ
  const rough = (60 * ENV_RATE) / bestLag;
  let best = { bpm: rough, phase: 0, score: -1 };
  for (let bpm = rough * 0.97; bpm <= rough * 1.03; bpm += 0.02) {
    const r = bestPhase(env, (60 * ENV_RATE) / bpm);
    if (r.score > best.score) best = { bpm, ...r };
  }
  // 作られた曲の多くは整数の BPM なので、近ければ整数にする
  const whole = Math.round(best.bpm);
  if (whole !== best.bpm && Math.abs(best.bpm - whole) < 0.2) {
    const r = bestPhase(env, (60 * ENV_RATE) / whole);
    if (r.score >= best.score * 0.9) best = { bpm: whole, ...r };
  }
  const bpm = Math.round(best.bpm * 100) / 100;
  const period = (60 * ENV_RATE) / bpm;

  // 4. 小節の頭を決める。4拍と、その裏（半拍ずれ）の8か所のうち、毎小節の音の立ち上がり（低音は2倍に数える）が
  //    最も強い所にする。シンコペーションの多い曲で、拍の裏を表と取り違えるのもここで直る
  let bar = 0;
  let barScore = -1;
  for (let i = 0; i < 8; i++) {
    let s = 0;
    for (let p = best.phase + (i * period) / 2; p < env.length; p += 4 * period) s += at(low, p);
    if (s > barScore) {
      barScore = s;
      bar = i;
    }
  }
  const offset = ((best.phase + (bar * period) / 2) / ENV_RATE) % ((4 * 60) / bpm);
  return { bpm, offset: Math.round(offset * 1000) / 1000, confidence: Math.max(0, Math.min(1, bestAc)) };
}

