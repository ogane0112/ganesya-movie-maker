import { describe, expect, it } from "vitest";
import { parseScript } from "../src/parse";
import type { AudioTiming } from "../src/schema";
import { buildTimeline, PACING } from "../src/timeline";

const doc = parseScript(`## A

一文目。
二文目。

:::bullets
- {1} x
- {2} y {!2}
:::

:::code lang=ts highlight="{2}:1"
const a = 1;
:::

## B

三文目。
`);

const audio: AudioTiming = {
  provider: "silent",
  voice: "zundamon",
  sentences: [
    { sceneId: "s01", index: 0, text: "一文目。", file: "audio/a.wav", seconds: 1.0 },
    { sceneId: "s01", index: 1, text: "二文目。", file: "audio/b.wav", seconds: 2.0 },
    { sceneId: "s02", index: 0, text: "三文目。", file: "audio/c.wav", seconds: 1.5 },
  ],
};

describe("buildTimeline", () => {
  it("音声の長さと間からフレームを決め、部品を文の開始に合わせる", async () => {
    const t = await buildTimeline(doc, audio);
    const fps = 30;
    const lead = PACING.leadIn * fps; // 12
    const gap = Math.round(PACING.gap * fps); // 11
    const tail = PACING.tail * fps; // 30
    const [a, b] = t.scenes;

    expect(a.sentences.map((s) => [s.from, s.durationInFrames])).toEqual([
      [lead, 30],
      [lead + 30 + gap, 60],
    ]);
    expect(a.durationInFrames).toBe(lead + 30 + gap + 60 + tail);
    expect(b.start).toBe(a.durationInFrames);
    expect(t.durationInFrames).toBe(a.durationInFrames + b.durationInFrames);

    const bullets = a.elements[0];
    if (bullets.type !== "bullets") throw new Error();
    expect(bullets.items.map((i) => i.from)).toEqual([lead, lead + 30 + gap]);
    expect(bullets.items[1].emphasisFrom).toBe(lead + 30 + gap);

    const code = a.elements[1];
    if (code.type !== "code") throw new Error();
    expect(code.from).toBe(0);
    expect(code.highlights).toEqual([{ from: lead + 30 + gap, lines: [1] }]);
    expect(code.lines[0].map((tk) => tk.content).join("")).toBe("const a = 1;");
  });

  it("音声が足りないとエラーにする", async () => {
    await expect(buildTimeline(doc, { ...audio, sentences: audio.sentences.slice(1) })).rejects.toThrow("音声が揃っていません");
  });
});
