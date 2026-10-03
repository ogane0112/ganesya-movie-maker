import { describe, expect, it } from "vitest";
import { applyReadings } from "../src/tts/index";
import type { Timeline } from "../src/schema";
import { toSrt } from "../src/subtitles";

describe("字幕", () => {
  it("文の開始から次の文の開始まで、最後の文は話し終えて0.3秒後まで出す", () => {
    const t = {
      meta: { fps: 30 },
      scenes: [
        {
          start: 0,
          durationInFrames: 120,
          sentences: [
            { text: "一文目。", from: 12, durationInFrames: 30 },
            { text: "二文目。", from: 53, durationInFrames: 30 },
          ],
        },
        { start: 120, durationInFrames: 60, sentences: [{ text: "三文目。", from: 12, durationInFrames: 3600 }] },
      ],
    } as unknown as Timeline;
    expect(toSrt(t)).toBe(
      "1\n00:00:00,400 --> 00:00:01,767\n一文目。\n\n" +
        "2\n00:00:01,767 --> 00:00:03,067\n二文目。\n\n" +
        "3\n00:00:04,400 --> 00:00:06,000\n三文目。\n",
    );
  });

  it("読みの辞書は長い表記から置き換える", () => {
    expect(applyReadings("S3バケットとS3", { S3: "エススリー", S3バケット: "エススリーバケット" })).toBe("エススリーバケットとエススリー");
    expect(applyReadings("a.b", { "a.b": "エービー" })).toBe("エービー");
  });
});
