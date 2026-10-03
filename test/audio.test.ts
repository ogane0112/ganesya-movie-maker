import { describe, expect, it } from "vitest";
import { bgmVolumeAt, speechSpans } from "../remotion/Sound";
import { chime } from "../src/audio";
import type { Timeline } from "../src/schema";
import { wavSeconds } from "../src/tts/wav";

const t = {
  meta: { fps: 30 },
  durationInFrames: 600,
  audio: { bgm: { src: "b.mp3", volume: 0.4, duck: 0.25 } },
  scenes: [{ start: 100, sentences: [{ from: 50, durationInFrames: 100 }] }],
} as unknown as Timeline;

describe("BGM のダッキング", () => {
  const spans = speechSpans(t);
  it("話している間は volume×duck、話していない間は volume", () => {
    expect(spans).toEqual([[150, 250]]);
    expect(bgmVolumeAt(200, t, spans)).toBeCloseTo(0.1);
    expect(bgmVolumeAt(300, t, spans)).toBeCloseTo(0.4);
    // 前後8フレームでなめらかに変わる
    expect(bgmVolumeAt(146, t, spans)).toBeCloseTo(0.4 - 0.3 * 0.5);
  });
  it("最初の1秒でフェードイン、最後の2秒でフェードアウト", () => {
    expect(bgmVolumeAt(0, t, spans)).toBe(0);
    expect(bgmVolumeAt(15, t, spans)).toBeCloseTo(0.2);
    expect(bgmVolumeAt(570, t, spans)).toBeCloseTo(0.2);
  });
});

describe("組み込みの効果音", () => {
  it("毎回同じ波形の 0.55 秒の WAV", () => {
    expect(chime().equals(chime())).toBe(true);
    expect(wavSeconds(chime())).toBeCloseTo(0.55, 2);
  });
});
