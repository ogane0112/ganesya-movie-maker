// ネタ動画の組み込み効果音。すべてコードで合成する（素材の権利を気にせず使える。毎回同じ波形になる）。
// 台本では {se:don} や !se chin と名前で書く。gmm se list で一覧できる。
import { SYNTH_RATE, toWav } from "../motion/synth.js";

const R = SYNTH_RATE;

/** 決まった乱数（同じ seed なら同じ列） */
function lcg(seed: number) {
  let x = seed >>> 0 || 1;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 2 ** 32 - 0.5;
  };
}

/** 長さ seconds のモノラルを f(t, i) で作り、ステレオにする */
function render(seconds: number, f: (t: number) => number): Float32Array {
  const n = Math.round(seconds * R);
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, f(i / R)));
    out[i * 2] = v;
    out[i * 2 + 1] = v;
  }
  return out;
}

const sin = (ph: number) => Math.sin(2 * Math.PI * ph);
const sq = (ph: number) => (ph % 1 < 0.5 ? 1 : -1);
const saw = (ph: number) => 2 * (ph % 1) - 1;
/** 立ち上がり a 秒・減衰の速さ d の包絡 */
const env = (t: number, a: number, d: number) => Math.min(1, t / a) * Math.exp(-t * d);

function don(): Float32Array {
  const rnd = lcg(3);
  let lp = 0;
  return render(0.7, (t) => {
    lp += 0.12 * (rnd() - lp);
    return sin(42 * t + (90 / 14) * (1 - Math.exp(-14 * t))) * env(t, 0.002, 5) * 0.95 + lp * env(t, 0.001, 14) * 1.4;
  });
}

function dodon(): Float32Array {
  const a = don();
  const out = new Float32Array(Math.round(1.0 * R) * 2);
  for (const [at, g] of [[0, 0.8], [0.22, 1]] as const) {
    const o = Math.round(at * R) * 2;
    for (let i = 0; i < a.length && o + i < out.length; i++) out[o + i] += a[i] * g;
  }
  return out;
}

function chin(): Float32Array {
  // 金属の鈴（倍音がずれた部分音）
  const parts = [
    [1, 1],
    [2.76, 0.5],
    [5.4, 0.25],
    [8.93, 0.12],
  ];
  return render(2.2, (t) => parts.reduce((s, [r, g]) => s + sin(1320 * r * t) * g * env(t, 0.002, 1.6 + r * 0.6), 0) * 0.45);
}

function pon(): Float32Array {
  return render(0.25, (t) => sin(880 * t + 300 * t * t) * env(t, 0.002, 22) * 0.7);
}

function kira(): Float32Array {
  // 上がっていくきらめき
  const notes = [1568, 2093, 2637, 3136, 4186];
  return render(1.0, (t) =>
    notes.reduce((s, f, k) => {
      const u = t - k * 0.06;
      return u < 0 ? s : s + (sin(f * u) + 0.3 * sin(f * 2.01 * u)) * env(u, 0.002, 6) * 0.22;
    }, 0),
  );
}

function boyon(): Float32Array {
  // ばねの揺れ（音の高さが波打ちながら下がる）
  let ph = 0;
  return render(0.6, (t) => {
    const f = 260 + 140 * Math.sin(2 * Math.PI * 14 * t) * Math.exp(-5 * t) - 80 * t;
    ph += f / R;
    return sin(ph) * env(t, 0.005, 4) * 0.8;
  });
}

function whooshSe(): Float32Array {
  const rnd = lcg(9);
  let lp = 0;
  const len = 0.4;
  return render(len, (t) => {
    lp += (0.03 + 0.45 * (t / len)) * (rnd() - lp);
    return lp * Math.sin(Math.PI * (t / len)) ** 2 * 2.2;
  });
}

function buzzer(): Float32Array {
  return render(0.75, (t) => {
    const on = t < 0.3 || (t > 0.38 && t < 0.72);
    return on ? (sq(140 * t) * 0.5 + sq(147 * t) * 0.3) * 0.5 : 0;
  });
}

function pinpon(): Float32Array {
  return render(1.0, (t) => {
    const a = sin(1318.5 * t) * env(t, 0.002, 4);
    const u = t - 0.28;
    const b = u > 0 ? sin(1046.5 * u) * env(u, 0.002, 3) : 0;
    return (t < 0.28 ? a : a * Math.exp(-(t - 0.28) * 30)) * 0.5 + b * 0.5;
  });
}

function zukoo(): Float32Array {
  // スライドホイッスルで下がる
  let ph = 0;
  return render(0.9, (t) => {
    const f = 1500 * Math.pow(0.25, t / 0.8);
    ph += f / R;
    const vib = 1 + 0.01 * Math.sin(2 * Math.PI * 7 * t);
    return sin(ph * vib) * Math.min(1, t / 0.02) * (t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.1) : 1) * 0.5;
  });
}

function drumroll(): Float32Array {
  // 小太鼓の連打（だんだん強く）→ 最後にシンバル
  const rnd = lcg(21);
  const hit = 1 / 22;
  return render(1.9, (t) => {
    if (t < 1.5) {
      const u = t % hit;
      return rnd() * 1.6 * env(u, 0.001, 70) * (0.35 + 0.5 * (t / 1.5));
    }
    const u = t - 1.5;
    return rnd() * 1.6 * env(u, 0.001, 5) * 0.8 + sin(60 * u) * env(u, 0.001, 9) * 0.6;
  });
}

function jaan(): Float32Array {
  // 明るい和音（発表・登場）
  const chord = [261.6, 329.6, 392, 523.3];
  return render(1.6, (t) => chord.reduce((s, f) => s + (saw(f * t) * 0.6 + sin(f * t) * 0.4), 0) * env(t, 0.01, 1.8) * 0.18);
}

function gaan(): Float32Array {
  // 低く濁った和音（ショック）
  const chord = [98, 103.8, 146.8, 155.6];
  const rnd = lcg(5);
  return render(1.8, (t) => chord.reduce((s, f) => s + saw(f * t), 0) * env(t, 0.004, 1.6) * 0.16 + rnd() * env(t, 0.001, 20) * 0.6);
}

function pyu(): Float32Array {
  // 上がる短い音（出現・ひらめき）
  let ph = 0;
  return render(0.3, (t) => {
    ph += (500 + 2500 * (t / 0.3)) / R;
    return sin(ph) * env(t, 0.003, 9) * 0.5;
  });
}

/** 名前 → 合成と説明（gmm se list で出す） */
export const SKIT_SE: Record<string, { make: () => Float32Array; label: string; use: string }> = {
  don: { make: don, label: "ドン", use: "テロップ・衝撃の一言" },
  dodon: { make: dodon, label: "ドドン", use: "大発表・場面の見出し" },
  chin: { make: chin, label: "チーン", use: "オチ・残念・沈黙" },
  pon: { make: pon, label: "ポン", use: "軽く出す（画像・スタンプ）" },
  pyu: { make: pyu, label: "ピュッ", use: "ひらめき・出現" },
  kira: { make: kira, label: "キラーン", use: "決め・ひらめき・きれい" },
  boyon: { make: boyon, label: "ボヨン", use: "ジャンプ・弾む・間抜け" },
  whoosh: { make: whooshSe, label: "ヒュッ", use: "移動・入れ替え・登場" },
  buzzer: { make: buzzer, label: "ブブー", use: "不正解・ダメ出し" },
  pinpon: { make: pinpon, label: "ピンポン", use: "正解・気づき" },
  zukoo: { make: zukoo, label: "ズコー", use: "ずっこけ・肩すかし" },
  drumroll: { make: drumroll, label: "ドラムロール", use: "発表の前の溜め（約1.9秒）" },
  jaan: { make: jaan, label: "ジャーン", use: "登場・発表・場面の頭" },
  gaan: { make: gaan, label: "ガーン", use: "ショック・絶望" },
};

/** 効果音の public/ からのパス */
export const skitSePath = (name: string) => `se/skit/${name}.wav`;

export const skitSeWav = (name: string): Buffer => toWav(SKIT_SE[name].make());
