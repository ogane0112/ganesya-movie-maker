import { describe, expect, it } from "vitest";
import { checkLayout, checkScene, type Measurement } from "../src/inspect/rules";
import type { ResolvedScene, Timeline } from "../src/schema";

const base: Measurement = { sceneId: "s01", canvas: { width: 1920, height: 1080 }, elements: [], texts: [] };
const rules = (m: Partial<Measurement>) => checkLayout({ ...base, ...m }, "s01").map((i) => [i.severity, i.rule]);

describe("checkLayout", () => {
  it("安全領域からのはみ出しを見つける", () => {
    expect(rules({ elements: [{ kind: "code", rect: { x: 96, y: 900, width: 500, height: 200 } }] })).toEqual([["error", "overflow"]]);
    expect(rules({ elements: [{ kind: "code", rect: { x: 96, y: 96, width: 1728, height: 888 } }] })).toEqual([]);
  });

  it("要素同士の重なりを見つける（接しているだけはOK）", () => {
    const a = { kind: "bullets", rect: { x: 100, y: 100, width: 500, height: 100 } };
    expect(rules({ elements: [a, { kind: "code", rect: { x: 100, y: 150, width: 500, height: 100 } }] })).toEqual([["error", "overlap"]]);
    expect(rules({ elements: [a, { kind: "code", rect: { x: 100, y: 200, width: 500, height: 100 } }] })).toEqual([]);
  });

  it("切れた行と小さすぎる文字を見つける", () => {
    const rect = { x: 100, y: 100, width: 10, height: 10 };
    expect(
      rules({
        texts: [
          { text: "a", fontSize: 36, rect, clipped: true },
          { text: "b", fontSize: 20, rect, clipped: false },
        ],
      }),
    ).toEqual([
      ["error", "clipped"],
      ["warn", "font-size"],
    ]);
  });
});

describe("checkScene", () => {
  const timeline = { meta: { fps: 30 } } as Timeline;
  const scene = (over: Partial<ResolvedScene>): ResolvedScene => ({
    id: "s01",
    heading: "h",
    showHeading: true,
    start: 0,
    durationInFrames: 300,
    sentences: [{ text: "a", from: 12, durationInFrames: 60 }],
    elements: [{ type: "text", text: "x", variant: "plain", from: 0 }],
    ...over,
  });
  const ruleNames = (s: ResolvedScene) => checkScene(s, timeline).map((i) => i.rule);

  it("問題のないシーンは何も出さない", () => {
    expect(ruleNames(scene({}))).toEqual([]);
  });

  it("短いシーン・表示時間の短い部品・長すぎる文を警告する", () => {
    expect(ruleNames(scene({ durationInFrames: 60, elements: [{ type: "text", text: "x", variant: "plain", from: 30 }] }))).toEqual([
      "short-scene",
      "short-visible",
    ]);
    expect(ruleNames(scene({ sentences: [{ text: "長い", from: 0, durationInFrames: 400 }] }))).toEqual(["long-sentence"]);
  });

  it("情報量の多すぎを警告する", () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ text: `項目${i}`, from: 0 }));
    expect(ruleNames(scene({ elements: [{ type: "bullets", from: 0, items }] }))).toEqual(["density"]);
    expect(ruleNames(scene({ elements: [{ type: "text", text: "あ".repeat(200), variant: "plain", from: 0 }] }))).toEqual(["density"]);
  });
});
