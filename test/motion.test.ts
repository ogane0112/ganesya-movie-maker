import { describe, expect, it } from "vitest";
import { THEMES } from "../remotion/theme";
import { lintCustomScene } from "../src/motion/custom";
import { parseMotionScript } from "../src/motion/parse";
import { synthesizeMusic } from "../src/motion/synth";
import { buildMotionTimeline, customId } from "../src/motion/timeline";
import type { AudioTiming } from "../src/schema";

const src = `---
layout: motion
bpm: 120
---

## A beats=4
:::backdrop style=grid :::
:::kinetic every=2
**一**行目
二行目
:::

## B transition=zoom
ナレーションの文。

:::counter value=1,200 from=100 suffix=+ {1}
ラベル
:::
:::chart kind=bar {beat:2}
- x: 1
- y: 2.5 !
:::

## C beats=2 transition=glitch
:::custom src=scenes/x.tsx color=red :::
`;

describe("モーション動画", () => {
  const doc = parseMotionScript(src);

  it("見出しの beats= と transition=、部品と既定値", () => {
    expect(doc.meta.theme).toBe("night");
    expect(doc.scenes.map((s) => [s.beats, s.transition])).toEqual([
      [4, "cut"],
      [undefined, "zoom"],
      [2, "glitch"],
    ]);
    expect(doc.scenes[0].motion?.map((m) => m.type)).toEqual(["backdrop", "kinetic"]);
    expect(doc.scenes[1].motion?.[0]).toMatchObject({ type: "counter", value: 1200, start: 100, suffix: "+", label: "ラベル", at: 1 });
    expect(doc.scenes[1].motion?.[1]).toMatchObject({ type: "chart", beat: 2, items: [{ label: "x", value: 1, highlight: false }, { label: "y", value: 2.5, highlight: true }] });
    expect(doc.scenes[2].motion?.[0]).toMatchObject({ type: "custom", src: "scenes/x.tsx", props: { color: "red" } });
  });

  it("場面の切れ目は拍にそろう。ナレーションの場面は拍に切り上げる", () => {
    const audio: AudioTiming = { provider: "silent", voice: "z", sentences: [{ sceneId: "s02", index: 0, text: "ナレーションの文。", file: "a", seconds: 2.2, mouth: [] }] };
    const t = buildMotionTimeline(doc, audio, THEMES.night);
    const fpb = 15; // 30fps・120BPM
    expect(t.motion).toEqual({ bpm: 120, framesPerBeat: fpb });
    // B: 0.3 + 2.2 + 0.5 = 3.0 秒 = 90 フレーム = 6 拍
    expect(t.scenes.map((s) => [s.start, s.durationInFrames])).toEqual([
      [0, 60],
      [60, 90],
      [150, 30],
    ]);
    // kinetic: every=2 → 2行目は 2 拍あと
    const k = t.scenes[0].motion![1];
    expect(k.type === "kinetic" && k.lines.map((l) => l.from)).toEqual([0, 30]);
    // {beat:2} は場面の2拍目
    expect(t.scenes[1].motion![1].from).toBe(15);
    // 転換の効果音（最初の場面は鳴らさない）
    expect(t.scenes.map((s) => s.se)).toEqual([undefined, "se/whoosh.wav", "se/impact.wav"]);
    expect(t.scenes[2].motion![0]).toMatchObject({ type: "custom", id: customId("scenes/x.tsx") });
  });

  it("長さのない場面・未知の部品はエラー", () => {
    expect(() => parseMotionScript("---\nlayout: motion\n---\n## A\n:::backdrop :::\n")).toThrow("長さがありません");
    expect(() => parseMotionScript("---\nlayout: motion\n---\n## A beats=2\n:::nope :::\n")).toThrow("未知の部品");
  });

  it("場面のコードは乱数・現在時刻を使えない", () => {
    expect(lintCustomScene("export default () => Math.random()", "x")).toHaveLength(1);
    expect(lintCustomScene("const d = new Date(); export default () => null", "x")[0]).toContain("Date");
    expect(lintCustomScene("export default function A() { return null }", "x")).toEqual([]);
  });

  it("合成した曲は毎回同じ", () => {
    const a = synthesizeMusic({ preset: "tech", bpm: 128, seconds: 2 });
    const b = synthesizeMusic({ preset: "tech", bpm: 128, seconds: 2 });
    expect(a.length).toBe(b.length);
    expect(a.every((v, i) => v === b[i])).toBe(true);
    expect(a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeLessThanOrEqual(0.9001);
  });
});
