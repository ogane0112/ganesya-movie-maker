import { describe, expect, it } from "vitest";
import { THEMES } from "../remotion/theme";
import { skitLayout } from "../remotion/skit/layout";
import { ScriptError } from "../src/parse";
import type { AudioTiming, CastMember, SceneDoc } from "../src/schema";
import { parseDirective, parseSkitScript } from "../src/skit/parse";
import { SKIT_SE, skitSeWav } from "../src/skit/sfx";
import { buildSkitTimeline } from "../src/skit/timeline";
import { checkSkitScene } from "../src/inspect/rules";
import { parseVoiceSpec } from "../src/tts/index";
import { mouthFromWav } from "../src/tts/wav";

const src = `---
layout: skit
format: short
style: yukkuri
banner: テスト
speakers:
  あか: metan
  まじょ: "zundamon pitch=0.05"
characters:
  あか: manju-red
  まじょ: manju-witch
---

## 起 bg=dots transition=flash
!caption 衝撃\\nの事実 style=impact
!se don
あか: {face:smile}{act:jump}こんにちは。元気？
まじょ: {fx:zoom}{se:pon}元気だぜ！
!exit あか
!wait 1
まじょ: ひとりになった。
!stamp ！？
!caption 完 style=title
!se chin

## 承
!enter あか center
あか: {act:fall}もどったよ。
`;

/** 1文 1 秒の仮の音声 */
function audioFor(doc: SceneDoc): AudioTiming {
  return {
    provider: "silent",
    voice: "x",
    sentences: doc.scenes.flatMap((s) => s.sentences.map((x, index) => ({ sceneId: s.id, index, text: x.text, file: `a/${s.id}-${index}.wav`, seconds: 1, mouth: [[0.1, 0.3]] as [number, number][] }))),
  };
}

const cast = (doc: SceneDoc): CastMember[] =>
  Object.keys(doc.meta.speakers).map((name, i) => ({
    name,
    color: i ? "#e6b422" : "#e0393e",
    character: { kind: "builtin", name, width: 400, height: 360, defaultFace: "normal", variant: i ? "manju-witch" : "manju-red" },
  }));

describe("ネタ動画の台本", () => {
  const doc = parseSkitScript(src);

  it("画面の形と既定値", () => {
    expect(doc.meta.layout).toBe("skit");
    expect([doc.meta.width, doc.meta.height]).toEqual([1080, 1920]);
    expect(doc.meta.theme).toBe("pop");
    expect(doc.meta.se).toBe("none");
  });

  it("指示は次の台詞に、文頭の印は その文に付く", () => {
    const [a, b, c] = doc.scenes[0].sentences;
    expect(a.speaker).toBe("あか");
    expect(a.face).toBe("smile");
    expect(a.cues).toEqual([
      { kind: "caption", text: "衝撃\\nの事実", style: "impact" },
      { kind: "se", se: "don" },
      { kind: "act", act: "jump" },
    ]);
    // 1行に2文あるとき、行の指示は最初の文だけ
    expect(b.text).toBe("元気？");
    expect(b.cues).toBeUndefined();
    expect(c.cues).toEqual([{ kind: "fx", fx: "zoom" }, { kind: "se", se: "pon" }]);
    const d = doc.scenes[0].sentences[3];
    expect(d.wait).toBe(1);
    expect(d.cues).toEqual([{ kind: "exit", who: "あか" }]);
  });

  it("最後の台詞の後の指示は tail、見出しの bg= と transition=", () => {
    expect(doc.scenes[0].skit).toMatchObject({ bg: "dots", transition: "flash" });
    expect(doc.scenes[0].skit!.tail.map((c) => c.kind)).toEqual(["stamp", "caption", "se"]);
  });

  it("指示の書き方の誤りは行番号つきで知らせる", () => {
    const bad = `---\nlayout: skit\nspeakers:\n  あか: metan\n---\n## a\n!act あか dance\n!enter だれ\n!nope\nあか: やあ。\n`;
    try {
      parseSkitScript(bad);
      throw new Error("エラーになるはず");
    } catch (e) {
      const p = (e as ScriptError).problems.join("\n");
      expect(p).toMatch(/7行目.*動きは jump/);
      expect(p).toMatch(/8行目.*「だれ」は話者にいません/);
      expect(p).toMatch(/9行目.*未知の指示 !nope/);
    }
  });

  it("話者が1人なら名前は省略でき、character: だけならナレーターになる", () => {
    const solo = parseSkitScript(`---\nlayout: skit\ncharacter: manju-green\nvoice: tsumugi\n---\n## a\nこんにちは。\n`);
    expect(solo.meta.speakers).toEqual({ ナレーター: "tsumugi" });
    expect(solo.meta.characters).toEqual({ ナレーター: "manju-green" });
    expect(solo.scenes[0].sentences[0].speaker).toBe("ナレーター");
  });

  it("parseDirective: 位置の語と key=value", () => {
    expect(parseDirective("pic cat.png pos=left size=0.5 in=slide", [])).toEqual({ kind: "pic", src: "cat.png", pos: "left", size: 0.5, anim: "slide" });
    expect(parseDirective("move まじょ 30", ["まじょ"])).toEqual({ kind: "move", who: "まじょ", pos: 30 });
    expect(parseDirective("caption", [])).toEqual({ kind: "caption", text: "", style: "impact" });
    expect(parseDirective("wait 0.5", [])).toEqual({ kind: "wait", seconds: 0.5 });
  });
});

describe("ネタ動画のタイムライン", () => {
  const doc = parseSkitScript(src);
  const t = buildSkitTimeline(doc, audioFor(doc), THEMES.pop, cast(doc));
  const [s1, s2] = t.scenes;
  const sk = s1.skit!;

  it("台詞の頭で指示が起き、!wait で間が空く", () => {
    const [a, , c, d] = s1.sentences;
    expect(sk.captions[0]).toMatchObject({ from: a.from, text: "衝撃\\nの事実", style: "impact" });
    expect(s1.sounds?.map((x) => [x.from, x.src])).toEqual([
      [a.from, "se/skit/don.wav"],
      [c.from, "se/skit/pon.wav"],
      [expect.any(Number), "se/skit/chin.wav"],
    ]);
    // 1 秒の間
    expect(d.from - (c.from + c.durationInFrames)).toBe(Math.round(0.2 * 30) + 30);
  });

  it("テロップは次のテロップで消え、最後の指示の後に余韻がある", () => {
    const last = s1.sentences.at(-1)!;
    expect(sk.captions[0].to).toBe(sk.captions[1].from);
    expect(sk.captions[1].from).toBeGreaterThan(last.from + last.durationInFrames);
    expect(sk.captions[1].to).toBe(s1.durationInFrames);
    expect(s1.durationInFrames - sk.captions[1].from).toBeGreaterThanOrEqual(30);
  });

  it("寄り（zoom）は話者に、次の台詞まで", () => {
    const [, , c, d] = s1.sentences;
    expect(sk.fx[0]).toEqual({ from: c.from, to: d.from, fx: "zoom", who: "まじょ" });
  });

  it("舞台の状態は次の場面に引き継ぐ（退場・表情）", () => {
    expect(sk.stage0.あか).toEqual({ on: true, pos: "left", face: "normal", flip: false });
    expect(s2.skit!.stage0.あか).toEqual({ on: false, pos: "left", face: "smile", flip: false });
    expect(s2.skit!.events.find((e) => e.kind === "enter")).toMatchObject({ who: "あか", pos: "center" });
    // 続く動き（fall）は次の台詞か場面の終わりまで
    const fall = s2.skit!.events.find((e) => e.kind === "act");
    expect(fall).toMatchObject({ act: "fall", to: s2.durationInFrames });
  });

  it("立ち絵のない人は動かせない", () => {
    const d = parseSkitScript(`---\nlayout: skit\nspeakers:\n  あか: metan\n---\n## a\nあか: {act:jump}やあ。\n`);
    expect(() => buildSkitTimeline(d, audioFor(d), THEMES.pop, [{ name: "あか", color: "#000" }])).toThrow(/立ち絵がない/);
  });

  it("検査：長すぎる大きなテロップ", () => {
    const d = parseSkitScript(`---\nlayout: skit\ncharacter: none\n---\n## a\n!caption とても長い長い長い長いテロップの文字です\nこんにちは。\n`);
    const tl = buildSkitTimeline(d, audioFor(d), THEMES.pop, []);
    expect(checkSkitScene(tl.scenes[0], tl).map((i) => i.rule)).toContain("caption-long");
  });

  it("割り付け：テロップの置き場所は字幕と帯に重ならない", () => {
    for (const [format, style] of [["short", "yukkuri"], ["short", "meme"], ["wide", "anime"], ["wide", "meme"], ["square", "yukkuri"]] as const) {
      const tl = { ...t, meta: { ...t.meta, ...(format === "wide" ? { width: 1920, height: 1080 } : format === "short" ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 }) }, skit: { ...t.skit!, format, style } };
      const L = skitLayout(tl);
      const subTop = L.H - L.subtitle.bottom - (L.subtitle.lineHeight * 2 + 24);
      expect(L.content.y).toBeGreaterThanOrEqual(L.banner?.height ?? 0);
      if (tl.skit.subtitleStyle !== "bubble") expect(L.content.y + L.content.height).toBeLessThanOrEqual(subTop);
    }
  });
});

describe("効果音・声", () => {
  it("組み込みの効果音は毎回同じ波形の WAV", () => {
    for (const name of Object.keys(SKIT_SE)) {
      const a = skitSeWav(name);
      expect(a.toString("ascii", 0, 4)).toBe("RIFF");
      expect(a.length).toBeGreaterThan(44 + 1000);
      expect(skitSeWav(name).equals(a)).toBe(true);
    }
  });

  it("声の指定：名前と VOICEVOX の調整", () => {
    expect(parseVoiceSpec("zundamon")).toEqual({ name: "zundamon" });
    expect(parseVoiceSpec("metan pitch=0.05 speed=1.2")).toEqual({ name: "metan", pitch: 0.05, speed: 1.2 });
    expect(() => parseVoiceSpec("metan loud=3")).toThrow(/loud=3/);
  });

  it("外部の読み上げの口パク：音のある所だけ開く", () => {
    const rate = 24000;
    const pcm = Buffer.alloc(rate * 2);
    // 0.2〜0.5 秒だけ音
    for (let i = Math.round(0.2 * rate); i < 0.5 * rate; i++) pcm.writeInt16LE(Math.round(Math.sin(i / 5) * 12000), i * 2);
    const head = Buffer.alloc(44);
    head.write("RIFF", 0, "ascii");
    head.writeUInt32LE(36 + pcm.length, 4);
    head.write("WAVEfmt ", 8, "ascii");
    head.writeUInt32LE(16, 16);
    head.writeUInt16LE(1, 20);
    head.writeUInt16LE(1, 22);
    head.writeUInt32LE(rate, 24);
    head.writeUInt32LE(rate * 2, 28);
    head.writeUInt16LE(2, 32);
    head.writeUInt16LE(16, 34);
    head.write("data", 36, "ascii");
    head.writeUInt32LE(pcm.length, 40);
    const m = mouthFromWav(Buffer.concat([head, pcm]));
    expect(m).toHaveLength(1);
    expect(m[0][0]).toBeCloseTo(0.2, 1);
    expect(m[0][1]).toBeCloseTo(0.5, 1);
  });
});
