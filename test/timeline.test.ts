import { describe, expect, it } from "vitest";
import { parseScript } from "../src/parse";
import type { AudioTiming } from "../src/schema";
import { THEMES } from "../remotion/theme";
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
    { sceneId: "s01", index: 0, text: "一文目。", file: "audio/a.wav", seconds: 1.0, mouth: [[0.1, 0.2]] },
    { sceneId: "s01", index: 1, text: "二文目。", file: "audio/b.wav", seconds: 2.0, mouth: [] },
    { sceneId: "s02", index: 0, text: "三文目。", file: "audio/c.wav", seconds: 1.5, mouth: [] },
  ],
};

describe("buildTimeline", () => {
  it("音声の長さと間からフレームを決め、部品を文の開始に合わせる", async () => {
    const t = await buildTimeline(doc, audio, THEMES.wakaba);
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
    await expect(buildTimeline(doc, { ...audio, sentences: audio.sentences.slice(1) }, THEMES.wakaba)).rejects.toThrow("音声が揃っていません");
  });
});

describe("richText", () => {
  it("$…$ だけを KaTeX にし、それ以外はエスケープする", async () => {
    const { richText } = await import("../src/timeline");
    const html = richText("<b>負荷</b> は $\\frac{1}{n}$");
    expect(html.startsWith("&lt;b&gt;負荷&lt;/b&gt; は ")).toBe(true);
    expect(html).toContain('class="katex"');
    expect(() => richText("$\\frac{1}{$")).toThrow("数式を描けません");
  });
});

describe("掛け合い（解説動画）", () => {
  const src = `---\nspeakers:\n  めたん: metan\n  ずんだもん: zundamon\n---\n## A\n\nずんだもん: {face:smile}一。二。\nめたん: {face:think}三。\n{face:normal}四。\n\n## B\n\nずんだもん: 五。\n`;
  const d = parseScript(src);

  it("話者: で話者が変わり、書かない行は直前の話者", () => {
    expect(d.scenes[0].sentences.map((s) => [s.speaker, s.text])).toEqual([
      ["ずんだもん", "一。"],
      ["ずんだもん", "二。"],
      ["めたん", "三。"],
      ["めたん", "四。"],
    ]);
    expect(d.scenes[1].sentences[0].speaker).toBe("ずんだもん");
  });

  it("話者のない最初の文はエラー", () => {
    expect(() => parseScript(`---\nspeakers:\n  めたん: metan\n---\n## A\n\n話者なし。\n`)).toThrow("文の頭に話者");
  });

  it("表情は話者ごとに続く", async () => {
    const au: AudioTiming = {
      provider: "silent",
      voice: "zundamon",
      sentences: d.scenes.flatMap((s) => s.sentences.map((x, i) => ({ sceneId: s.id, index: i, text: x.text, file: "a", seconds: 1, mouth: [] }))),
    };
    const cast = [
      { name: "めたん", color: "#c2508e" },
      { name: "ずんだもん", color: "#4f9a3c" },
    ];
    const t = await buildTimeline(d, au, THEMES.wakaba, undefined, {}, cast);
    expect(t.cast).toEqual(cast);
    expect(t.character).toBeUndefined();
    const faces = t.scenes.flatMap((s) => s.sentences.map((x) => x.face));
    // ずんだもんの smile は めたんの文をはさんでも B まで続く
    expect(faces).toEqual(["smile", "smile", "think", "normal", "smile"]);
  });
});
