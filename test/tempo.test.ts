import { describe, expect, it } from "vitest";
import { synthesizeMusic, SYNTH_RATE } from "../src/motion/synth";
import { estimateTempo, TEMPO_RATE } from "../src/tempo";

/** 合成した曲（ステレオ・SYNTH_RATE）を、頭に無音を足したモノラル・TEMPO_RATE にする */
function song(preset: "drive" | "tech", bpm: number, pad: number): Float32Array {
  const st = synthesizeMusic({ preset, bpm, seconds: 20 });
  const ratio = SYNTH_RATE / TEMPO_RATE;
  const head = Math.round(pad * TEMPO_RATE);
  const n = Math.floor(st.length / 2 / ratio);
  const out = new Float32Array(head + n);
  for (let i = 0; i < n; i++) {
    const j = Math.floor(i * ratio);
    out[head + i] = (st[j * 2] + st[j * 2 + 1]) / 2;
  }
  return out;
}

describe("曲のテンポを測る", () => {
  it("テンポと最初の小節の頭（頭の無音の長さ）を測る", () => {
    const r = estimateTempo(song("drive", 128, 0.37));
    expect(r.bpm).toBe(128);
    expect(r.offset).toBeCloseTo(0.37, 1);
    expect(r.confidence).toBeGreaterThan(0.3);
  }, 30000);

  it("小節の頭を取り違えても、拍の位置はそろう", () => {
    const r = estimateTempo(song("tech", 100, 0.5));
    expect(r.bpm).toBe(100);
    const beat = 60 / 100;
    const k = (r.offset - 0.5) / beat;
    expect(Math.abs(k - Math.round(k))).toBeLessThan(0.05);
  }, 30000);

  it("無音は 120 BPM・はっきりさ 0 にする", () => {
    expect(estimateTempo(new Float32Array(TEMPO_RATE * 10))).toEqual({ bpm: 120, offset: 0, confidence: 0 });
  });
});
