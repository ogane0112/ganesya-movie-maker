import { describe, expect, it } from "vitest";
import { currentSplit, formatRunTime, runTimeAt } from "../remotion/biim/run";
import { THEMES } from "../remotion/theme";
import { parseBiimScript } from "../src/biim/parse";
import { buildBiimTimeline, buildFootageMap, frameToVideo, videoToFrame } from "../src/biim/timeline";
import type { AudioTiming } from "../src/schema";

const fps = 30;

describe("録画の流し方（カット・倍速）", () => {
  const map = buildFootageMap(
    [
      { type: "cut", from: 10, to: 14, rate: 1 },
      { type: "fast", from: 20, to: 40, rate: 4 },
    ],
    60,
    fps,
  );
  it("カットを除き、倍速区間を縮める", () => {
    expect(map).toEqual([
      { from: 0, durationInFrames: 300, videoFrom: 0, rate: 1 },
      { from: 300, durationInFrames: 180, videoFrom: 14, rate: 1 },
      { from: 480, durationInFrames: 150, videoFrom: 20, rate: 4 },
      { from: 630, durationInFrames: 600, videoFrom: 40, rate: 1 },
    ]);
  });
  it("録画の時刻 ↔ 出力のフレーム", () => {
    expect(videoToFrame(5, map, fps)).toEqual({ frame: 150, inCut: false });
    expect(videoToFrame(12, map, fps)).toEqual({ frame: 300, inCut: true });
    expect(videoToFrame(30, map, fps).frame).toBe(480 + 75);
    expect(frameToVideo(555, map, fps)).toBeCloseTo(30);
  });
  it("重なる編集・録画を越える編集はエラー", () => {
    expect(() => buildFootageMap([{ type: "cut", from: 1, to: 5, rate: 1 }, { type: "cut", from: 4, to: 6, rate: 1 }], 60, fps)).toThrow("重なっています");
    expect(() => buildFootageMap([{ type: "cut", from: 50, to: 70, rate: 1 }], 60, fps)).toThrow("越えています");
  });
});

describe("buildBiimTimeline", () => {
  const doc = parseBiimScript(`---
title: t
layout: biim
video: v.mp4
runStart: 0:02
runEnd: 0:50
speakers:
  ず: zundamon
  め: metan
---
!cut 0:10-0:14
@0:00
ず: 一。
め: 二。
## A @0:02
@0:03
ず: 長い三。
@0:04
め: 四。
## B @0:20
@0:21
ず: 五。
`);
  const secs = [1, 1, 10, 1, 1];
  let k = 0;
  const audio: AudioTiming = {
    provider: "silent",
    voice: "zundamon",
    sentences: doc.scenes.flatMap((s) => s.sentences.map((x, i) => ({ sceneId: s.id, index: i, text: x.text, file: `a${k}.wav`, seconds: secs[k++], mouth: [] }))),
  };
  const t = buildBiimTimeline(doc, audio, THEMES.wakaba, [], { src: "footage/v.mp4", width: 640, height: 480, duration: 60 });

  it("区間ごとのシーンに分け、発言は前の発言が終わるまで待つ", () => {
    expect(t.scenes.map((s) => [s.heading, s.start, s.durationInFrames])).toEqual([
      ["開始前", 0, 60],
      ["A", 60, 420], // 0:02 → 0:20（カット 4 秒を除く = 14 秒 = 420 フレーム）
      ["B", 480, t.durationInFrames - 480],
    ]);
    const all = t.scenes.flatMap((s) => s.sentences.filter((x) => !x.carry).map((x) => [x.text, s.start + x.from, x.anchor === undefined ? undefined : s.start + x.anchor]));
    expect(all).toEqual([
      ["一。", 9, 0],
      ["二。", 9 + 30 + 8, undefined],
      ["長い三。", 90, 90],
      ["四。", 90 + 300 + 8, 120], // @0:04 より 8.9 秒遅れる
      ["五。", 510, 510],
    ]);
  });

  it("シーンをまたぐ発言は、次のシーンに字幕だけ（carry）で入る", () => {
    // 「二。」(47〜77) は 開始前 で始まり A（60〜）にまたがる
    expect(t.scenes[1].sentences.map((s) => [s.text, s.carry ?? false, s.from, s.audio])).toEqual([
      ["二。", true, 47 - 60, undefined],
      ["長い三。", false, 30, "a2.wav"],
      ["四。", false, 338, "a3.wav"],
    ]);
    expect(t.scenes[2].sentences.some((s) => s.carry)).toBe(false);
  });

  it("区間の終了タイムとタイマー", () => {
    expect(t.run!.splits).toEqual([
      { name: "A", endRunTime: 18 },
      { name: "B", endRunTime: 48 },
    ]);
    const run = t.run!;
    expect(runTimeAt(0, run, fps)).toBe(0); // 計測前
    expect(runTimeAt(300, run, fps)).toBeCloseTo(12); // カットの直後 = 録画 14 秒
    expect(runTimeAt(99999, run, fps)).toBe(48); // 計測後は最終タイムで止まる
    expect(currentSplit(10, run)).toBe(0);
    expect(currentSplit(48, run)).toBe(2);
    expect(formatRunTime(83.456)).toBe("1:23.45");
  });

  it("カットの中の発言はエラー", () => {
    const bad = parseBiimScript(`---\nlayout: biim\nvideo: v.mp4\nrunStart: 0\nrunEnd: 50\n---\n!cut 0:10-0:14\n## A @0:00\n@0:12\n文。\n`);
    const au: AudioTiming = { provider: "silent", voice: "z", sentences: [{ sceneId: "s01", index: 0, text: "文。", file: "a", seconds: 1, mouth: [] }] };
    expect(() => buildBiimTimeline(bad, au, THEMES.wakaba, [], { src: "v", width: 1, height: 1, duration: 60 })).toThrow("!cut の区間の中です");
  });
});
