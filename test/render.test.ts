import { describe, expect, it } from "vitest";
import { sceneTimeline } from "../src/render";
import type { Timeline } from "../src/schema";

describe("sceneTimeline（シーン単位の書き出し）", () => {
  const t = {
    meta: { fps: 30 },
    durationInFrames: 300,
    scenes: [
      { id: "s01", start: 0, durationInFrames: 100, sentences: [{ face: "smile" }, {}] },
      { id: "s02", start: 100, durationInFrames: 120, sentences: [{}, { face: "think" }] },
      { id: "s03", start: 220, durationInFrames: 80, sentences: [{}] },
    ],
  } as unknown as Timeline;

  it("1シーンだけを開始0で持ち、前のシーンの表情を引き継ぐ", () => {
    const s = sceneTimeline(t, 2);
    expect(s.durationInFrames).toBe(80);
    expect(s.scenes.map((x) => [x.id, x.start])).toEqual([["s03", 0]]);
    expect(s.segment).toEqual({ index: 2, initialFace: "think" });
    expect(sceneTimeline(t, 1).segment).toEqual({ index: 1, initialFace: "smile" });
    expect(sceneTimeline(t, 0).segment).toEqual({ index: 0, initialFace: undefined });
  });

  it("シーンの開始位置が変わっても、中身が同じなら同じタイムラインになる（キャッシュが効く）", () => {
    const shifted = { ...t, scenes: t.scenes.map((s, i) => (i === 1 ? { ...s, start: 999 } : s)) } as Timeline;
    expect(JSON.stringify(sceneTimeline(shifted, 1).scenes)).toBe(JSON.stringify(sceneTimeline(t, 1).scenes));
  });
});
