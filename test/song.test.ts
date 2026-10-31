import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "../remotion/theme";
import { karaokeProgress } from "../remotion/skit/SkitScene";
import { arrange, songTimes } from "../src/music/arrange";
import { parseMelody, parseSongScript } from "../src/music/parse";
import { noteToMidi, parseChord, splitMora } from "../src/music/score";
import { mouthFromPhonemes, SING_FPS } from "../src/music/sing";
import { buildSongAudio, buildSongTimeline } from "../src/music/song";
import { ScriptError } from "../src/parse";

const src = `---
title: てすと
layout: song
bpm: 120
singer: zundamon
transpose: 2
---

## イントロ chords="C G"

## サビ chords="F G,G7 | C C"
melody: C5 - D5 . E5 E5 - - | G4 - - - . . . . |
lyrics: らららーん
text: ラララーン
`;

describe("楽譜の部品", () => {
  it("音名・コード・歌詞の音", () => {
    expect([noteToMidi("C4"), noteToMidi("A4"), noteToMidi("F#3"), noteToMidi("Bb4"), noteToMidi("H4")]).toEqual([60, 69, 54, 70, undefined]);
    expect(parseChord("Am7")).toMatchObject({ root: 9, bass: 9, intervals: [0, 3, 7, 10] });
    expect(parseChord("C/E")).toMatchObject({ root: 0, bass: 4 });
    expect(() => parseChord("Cxyz")).toThrow(/コード「Cxyz」/);
    expect(splitMora("きゃっと ずんだー！")).toEqual(["きゃ", "っ", "と", "ず", "ん", "だ", "あ"]);
  });

  it("メロディ：- で伸ばし、. で休み、| で小節の長さを確かめる", () => {
    const { notes, steps } = parseMelody("C4 - . . E4 - - G4", 8);
    expect(steps).toBe(8);
    expect(notes).toEqual([
      { key: 60, steps: 2, lyric: "" },
      { key: null, steps: 2, lyric: "" },
      { key: 64, steps: 3, lyric: "" },
      { key: 67, steps: 1, lyric: "" },
    ]);
    expect(() => parseMelody("C4 - - | D4", 8)).toThrow(/1 小節目が 3 升/);
  });
});

describe("曲の台本", () => {
  const doc = parseSongScript(src);

  it("セクション・コード・盛り上がり・歌詞の割り当て・移調", () => {
    expect(doc.meta.layout).toBe("song");
    const [intro, chorus] = doc.scenes.map((s) => s.song!);
    expect(intro).toMatchObject({ bars: 2, chords: ["C", "G"], energy: "mid", phrases: [] });
    expect(chorus.energy).toBe("high");
    expect(chorus.bars).toBe(4); // コード 4 つ（"G,G7" は 1 小節を半分ずつ）
    expect(chorus.chords).toEqual(["F", "G,G7", "C", "C"]);
    const notes = chorus.phrases[0].notes.filter((n) => n.key !== null);
    expect(notes.map((n) => n.lyric)).toEqual(["ら", "ら", "ら", "あ", "ん"]);
    expect(notes[0].key).toBe(74); // C5 + 2
    expect(doc.scenes[1].sentences[0]).toMatchObject({ text: "ラララーン", speaker: "ずんだもん" });
  });

  it("歌詞と音符の数が合わないと、行番号つきで知らせる", () => {
    const bad = src.replace("lyrics: らららーん", "lyrics: らら");
    try {
      parseSongScript(bad);
      throw new Error("エラーになるはず");
    } catch (e) {
      expect((e as ScriptError).problems.join("\n")).toMatch(/12行目: 歌詞が 2 音.*音符は 5 個/);
    }
  });

  it("伴奏は決まった長さ・毎回同じ波形", () => {
    const sections = doc.scenes.map((s) => s.song!);
    const { total } = songTimes(120, sections);
    expect(total).toBe(12); // 6 小節 × 2 秒
    const a = arrange({ bpm: 120, music: "rock", transpose: 0, sections, lead: true }, 1);
    expect(a.length).toBe(Math.ceil(13 * 44100) * 2);
    const b = arrange({ bpm: 120, music: "rock", transpose: 0, sections, lead: true }, 1);
    expect(Buffer.from(b.buffer).equals(Buffer.from(a.buffer))).toBe(true);
    let peak = 0;
    for (let i = 0; i < 44100 * 4; i++) peak = Math.max(peak, Math.abs(a[i]));
    expect(peak).toBeGreaterThan(0.05);
  }, 60000);

  it("歌なし（VOICEVOX なし）でも曲と、カラオケ・口パクのタイムラインができる", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gmm-song-"));
    try {
      const audio = await buildSongAudio(doc, dir, {});
      expect(audio.seconds).toBeCloseTo(14, 0);
      expect(audio.phrases).toHaveLength(1);
      expect(audio.phrases[0].start).toBeCloseTo(4, 5); // サビの頭
      const t = buildSongTimeline(doc, THEMES.pop, [{ name: "ずんだもん", color: "#3a7a37" }], audio);
      const s = t.scenes[1].sentences[0];
      expect(s.from).toBe(0);
      expect(s.karaoke).toHaveLength(7); // 音符 5 つと間の休み 1 つの頭、終わり
      expect(s.mouth.length).toBe(5);
      expect(t.scenes[0].skit!.captions[0]).toMatchObject({ text: "てすと", style: "title" });
      expect(t.audio.bgm).toMatchObject({ duck: 1, fadeIn: false });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60000);
});

describe("歌の口パクとカラオケ", () => {
  it("母音の間だけ口を開け、続く母音の間で一瞬閉じる", () => {
    const f = (s: number) => Math.round(s * SING_FPS);
    const m = mouthFromPhonemes(
      [
        { phoneme: "pau", frame_length: f(0.1) },
        { phoneme: "r", frame_length: f(0.05) },
        { phoneme: "a", frame_length: f(0.3) },
        { phoneme: "a", frame_length: f(0.3) },
      ],
      0.1,
    );
    expect(m).toHaveLength(2);
    expect(m[0][1]).toBeLessThan(m[1][0]);
  });

  it("カラオケの進み具合", () => {
    expect(karaokeProgress([10, 20, 30], 5)).toBe(0);
    expect(karaokeProgress([10, 20, 30], 15)).toBeCloseTo(0.25);
    expect(karaokeProgress([10, 20, 30], 20)).toBeCloseTo(0.5);
    expect(karaokeProgress([10, 20, 30], 40)).toBe(1);
  });
});
