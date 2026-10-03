import { describe, expect, it } from "vitest";
import { formatTime, parseBiimScript, parseTime } from "../src/biim/parse";
import { ScriptError } from "../src/parse";

const head = `---
title: テストRTA
layout: biim
video: run.mp4
runStart: 0:05
runEnd: 2:25.5
speakers:
  ずんだもん: zundamon
  めたん: metan
---
`;

describe("parseTime / formatTime", () => {
  it("分:秒・時:分:秒・秒を読む", () => {
    expect(parseTime("1:23.5")).toBe(83.5);
    expect(parseTime("1:02:03")).toBe(3723);
    expect(parseTime("45")).toBe(45);
    expect(parseTime(12)).toBe(12);
    expect(() => parseTime("1分")).toThrow("時刻の書き方");
  });
  it("表示用に整える", () => {
    expect(formatTime(83.5)).toBe("1:23.5");
    expect(formatTime(3723.25, 2)).toBe("1:02:03.25");
  });
});

describe("parseBiimScript", () => {
  it("区間・@時刻・話者・編集を読む", () => {
    const d = parseBiimScript(`${head}
!cut 0:50-0:54
!fast 1:10-1:30 x4

@0:00
ずんだもん: {face:smile}はい、よーいスタートなのだ。今回は1-1からなのだ。
めたん: よろしくね。

## 1-1 @0:06
@0:10
めたん: ここはジャンプで越えるわ。
続けて話すわ。

## 1-2 @0:54
@1:00
ずんだもん: 2面なのだ。
`);
    expect(d.meta.layout).toBe("biim");
    expect(d.edits).toEqual([
      { type: "cut", from: 50, to: 54, rate: 1 },
      { type: "fast", from: 70, to: 90, rate: 4 },
    ]);
    expect(d.scenes.map((s) => [s.id, s.heading, s.splitAt])).toEqual([
      ["s01", "開始前", undefined],
      ["s02", "1-1", 6],
      ["s03", "1-2", 54],
    ]);
    expect(d.scenes[0].sentences).toEqual([
      { text: "はい、よーいスタートなのだ。", face: "smile", speaker: "ずんだもん", at: 0 },
      { text: "今回は1-1からなのだ。", speaker: "ずんだもん" },
      { text: "よろしくね。", speaker: "めたん" },
    ]);
    // 話者を書かない行は直前の話者
    expect(d.scenes[1].sentences.map((s) => [s.speaker, s.at])).toEqual([
      ["めたん", 10],
      ["めたん", undefined],
    ]);
  });

  it("誤りを行番号付きで報告する", () => {
    try {
      parseBiimScript(`${head}
ずんだもん: 時刻がない。
## 1-1
@0:10
@0:05
だれ: 話者がいない。
:::bullets
`);
      expect.unreachable();
    } catch (e) {
      const p = (e as ScriptError).problems.join("\n");
      expect(p).toContain("12行目: 最初の発言の前に、録画の時刻を");
      expect(p).toContain("13行目: 区間の見出しには録画の時刻を付けてください");
      expect(p).toContain("15行目: @0:05 が前の @ より前の時刻です");
      expect(p).toContain("17行目: ゲーム実況の台本では使えない行です");
      expect(p).toContain("区間がありません");
    }
  });
});
