// 曲を作る：伴奏を合成し、フレーズごとの歌声を重ねて 1 本の WAV にする。歌詞の表示（カラオケ）と口パクのタイミングも出す。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Theme } from "../../remotion/theme.js";
import { toWav } from "../motion/synth.js";
import type { CastMember, ResolvedScene, SceneDoc, Timeline } from "../schema.js";
import type { ResolvedBg } from "../skit/schema.js";
import { parseBgSpec } from "../skit/timeline.js";
import { resolveElement } from "../timeline.js";
import { arrange, MUSIC_RATE, songTimes } from "./arrange.js";
import { singerName } from "./parse.js";
import { midiToName } from "./score.js";
import { SING_PAD, singPhrase } from "./sing.js";

/** フレーズの位置（秒）と音符ごとの始まり、口を開けている区間（秒、曲の頭から） */
export type PhraseTiming = { scene: number; index: number; start: number; end: number; noteStarts: number[]; mouth: [number, number][] };

export type SongAudio = {
  /** 出力ディレクトリの public/ からのパス */
  mix: string;
  seconds: number;
  phrases: PhraseTiming[];
  warnings: string[];
  credit?: string;
};

/** 歌いやすい高さ（MIDI）。外れたら知らせる */
export const VOCAL_RANGE = { low: 55, high: 81 };

export async function buildSongAudio(
  doc: SceneDoc,
  outDir: string,
  opts: { voicevoxUrl?: string; singer?: { id: number; teacher: number; credit: string }; log?: (m: string) => void },
): Promise<SongAudio> {
  const { bpm, music, transpose, singer } = doc.meta;
  const sections = doc.scenes.map((s) => s.song!);
  const { barSec, starts, total } = songTimes(bpm, sections);
  const sung = singer !== "none" && !!opts.singer;
  const warnings: string[] = [];

  // フレーズの時刻
  const phrases: (PhraseTiming & { notes: { key: number | null; seconds: number; lyric: string }[] })[] = [];
  sections.forEach((sec, si) => {
    sec.phrases.forEach((ph, k) => {
      let pos = ph.at;
      const noteStarts: number[] = [];
      const notes = ph.notes.map((nt) => {
        const at = starts[si] + (pos / sec.grid) * barSec;
        pos += nt.steps;
        noteStarts.push(at);
        return { key: nt.key, seconds: (nt.steps / sec.grid) * barSec, lyric: nt.lyric };
      });
      // 先頭と末尾の休みは歌詞の表示に含めない
      const first = ph.notes.findIndex((n) => n.key !== null);
      const last = ph.notes.findLastIndex((n) => n.key !== null);
      if (first < 0) return;
      const start = noteStarts[first];
      const end = noteStarts[last] + notes[last].seconds;
      for (const nt of ph.notes) {
        if (nt.key !== null && singer !== "none" && (nt.key < VOCAL_RANGE.low || nt.key > VOCAL_RANGE.high)) {
          warnings.push(`「${doc.scenes[si].heading}」${k + 1}つ目のフレーズの ${midiToName(nt.key)}（${nt.lyric}）は歌うには${nt.key < VOCAL_RANGE.low ? "低" : "高"}すぎます（${midiToName(VOCAL_RANGE.low)}〜${midiToName(VOCAL_RANGE.high)} がよい。transpose: で全体をずらせます）`);
          break;
        }
      }
      const sungNotes = notes.slice(first, last + 1);
      const mouth: [number, number][] = [];
      // 歌声がないとき（仮）の口パク：音符の間だけ開ける
      sungNotes.forEach((nt, i) => nt.key !== null && mouth.push([noteStarts[first + i] - start, noteStarts[first + i] - start + Math.max(0.06, nt.seconds - 0.05)]));
      phrases.push({ scene: si, index: k, start, end, noteStarts: [...noteStarts.slice(first, last + 1), end], mouth, notes: sungNotes });
    });
  });

  // 伴奏（歌がなければ楽器がメロディを弾く）
  const accomp = arrange({ bpm, music, transpose, sections, lead: !sung });
  const n = accomp.length / 2;

  // 歌声を重ねる
  const vocal = new Float32Array(n);
  if (sung) {
    for (const [i, ph] of phrases.entries()) {
      opts.log?.(`歌: ${i + 1}/${phrases.length}「${ph.notes.map((x) => x.lyric).join("")}」`);
      const r = await singPhrase(opts.voicevoxUrl!, opts.singer!, ph.notes, outDir);
      ph.mouth = r.mouth;
      const pcm = await readMono(join(outDir, "public", r.file));
      const s0 = (ph.start - SING_PAD) * MUSIC_RATE;
      // 24000Hz → 44100Hz（直線で補間）
      const ratio = pcm.rate / MUSIC_RATE;
      const len = Math.floor(pcm.data.length / ratio);
      for (let j = 0; j < len; j++) {
        const x = j * ratio;
        const a = Math.floor(x);
        const v = pcm.data[a] + ((pcm.data[a + 1] ?? 0) - pcm.data[a]) * (x - a);
        const at = Math.round(s0) + j;
        if (at >= 0 && at < n) vocal[at] += v;
      }
    }
  }

  // 音量：歌を伴奏より少し大きく。歌に軽い残響
  const rms = (f: (i: number) => number, count: number) => {
    let s = 0;
    let c = 0;
    for (let i = 0; i < count; i += 4) {
      const v = f(i);
      if (v !== 0) (s += v * v), c++;
    }
    return c ? Math.sqrt(s / c) : 0;
  };
  const accRms = rms((i) => (accomp[i * 2] + accomp[i * 2 + 1]) / 2, n);
  const vocRms = rms((i) => vocal[i], n);
  const vg = vocRms > 0 ? (accRms * 1.8) / vocRms : 0;
  const wet = reverb(vocal);
  const out = new Float32Array(n * 2);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    out[i * 2] = accomp[i * 2] + (vocal[i] + wet[0][i] * 0.22) * vg;
    out[i * 2 + 1] = accomp[i * 2 + 1] + (vocal[i] + wet[1][i] * 0.22) * vg;
    peak = Math.max(peak, Math.abs(out[i * 2]), Math.abs(out[i * 2 + 1]));
  }
  const g = peak > 0 ? 0.9 / peak : 1;
  for (let i = 0; i < out.length; i++) out[i] *= g;

  const wav = toWav(out, MUSIC_RATE);
  const name = `bgm/song-${createHash("sha1").update(wav).digest("hex").slice(0, 16)}.wav`;
  await mkdir(join(outDir, "public/bgm"), { recursive: true });
  if (!existsSync(join(outDir, "public", name))) await writeFile(join(outDir, "public", name), wav);
  return { mix: name, seconds: n / MUSIC_RATE, phrases: phrases.map(({ notes: _n, ...p }) => p), warnings, credit: sung ? opts.singer!.credit : undefined };
}

/** 16bit PCM の WAV をモノラルの float で読む */
async function readMono(file: string): Promise<{ rate: number; data: Float32Array }> {
  const buf = await readFile(file);
  let rate = 24000;
  let ch = 1;
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") (ch = buf.readUInt16LE(off + 10)), (rate = buf.readUInt32LE(off + 12));
    if (id === "data") {
      const count = Math.floor(Math.min(size, buf.length - off - 8) / 2 / ch);
      const data = new Float32Array(count);
      for (let i = 0; i < count; i++) data[i] = buf.readInt16LE(off + 8 + i * ch * 2) / 32768;
      return { rate, data };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`歌声の WAV を読めません: ${file}`);
}

/** 軽い残響（くし形フィルタを並べたもの）。左右で少し違う長さにして広がりを出す */
function reverb(x: Float32Array): [Float32Array, Float32Array] {
  const out: [Float32Array, Float32Array] = [new Float32Array(x.length), new Float32Array(x.length)];
  const sets = [
    [0.0297, 0.0371, 0.0411, 0.0437],
    [0.0311, 0.0353, 0.0423, 0.0451],
  ];
  sets.forEach((delays, c) => {
    for (const d of delays) {
      const D = Math.round(d * MUSIC_RATE);
      const buf = new Float32Array(x.length);
      for (let i = 0; i < x.length; i++) {
        buf[i] = x[i] + (i >= D ? buf[i - D] * 0.78 : 0);
        out[c][i] += buf[i] / delays.length;
      }
    }
  });
  return out;
}

/**
 * 曲の動画のタイムライン。歌詞はカラオケで出る。
 * - 部品（:::diagram など）のある曲：解説動画のスライド（左）に、フレーズに合わせて図解が出て、歌う人は右に立つ
 * - 部品のない曲：ネタ動画（skit）の舞台で、歌う人が真ん中に立つ
 */
export async function buildSongTimeline(doc: SceneDoc, theme: Theme, cast: CastMember[], audio: SongAudio, bgs: Record<string, ResolvedBg> = {}): Promise<Timeline> {
  if (doc.scenes.some((s) => s.elements.length)) return buildSlidesTimeline(doc, theme, cast, audio);
  const { fps, bpm } = doc.meta;
  const sections = doc.scenes.map((s) => s.song!);
  const { starts, total } = songTimes(bpm, sections);
  const frame = (sec: number) => Math.round(sec * fps);
  const tail = 1.5;
  const name = singerName(doc.meta.singer);
  const DEFAULT_BG = { low: "night", mid: "dots", high: "sunburst" } as const;
  const scenes: ResolvedScene[] = doc.scenes.map((scene, si) => {
    const start = frame(starts[si]);
    const end = si === doc.scenes.length - 1 ? frame(total + tail) : frame(starts[si + 1]);
    const sentences = audio.phrases
      .filter((p) => p.scene === si)
      .map((p) => {
        const from = frame(p.start) - start;
        return {
          text: scene.sentences[p.index].text,
          from,
          durationInFrames: Math.max(1, frame(p.end) - frame(p.start)),
          speaker: name,
          mouth: p.mouth.map(([a, b]): [number, number] => [from + frame(a), from + Math.max(frame(b), frame(a) + 1)]),
          karaoke: p.noteStarts.map((t) => frame(t) - start),
          ...(scene.sentences[p.index].face && { face: scene.sentences[p.index].face }),
        };
      });
    // show: の文字は、そのフレーズの頭から次のフレーズの頭まで大きく出す
    const shows = audio.phrases
      .filter((p) => p.scene === si)
      .flatMap((p, k, list) => {
        const show = sections[si].phrases[p.index].show;
        if (!show) return [];
        const from = Math.max(0, frame(p.start) - start - 3);
        const to = list[k + 1] ? frame(list[k + 1].start) - start - 3 : end - start;
        return [{ from, to, text: show, style: "impact" as const, pos: "top" as const }];
      });
    const spec = scene.skit?.bg ?? DEFAULT_BG[sections[si].energy];
    const first = si === 0 && !sentences.length;
    return {
      id: scene.id,
      heading: scene.heading,
      showHeading: false,
      start,
      durationInFrames: end - start,
      sentences,
      elements: [],
      skit: {
        bg: bgs[spec] ?? parseBgSpec(spec),
        transition: scene.skit?.transition ?? (si === 0 ? "fade" : "cut"),
        stage0: Object.fromEntries(cast.filter((c) => c.character).map((c) => [c.name, { on: true, pos: "center" as const, face: c.character!.defaultFace, flip: false }])),
        events: [],
        // 曲の頭（前奏）に題名
        captions: first ? [{ from: 0, to: end - start, text: doc.meta.title, style: "title" as const }] : shows,
        stamps: [],
        pics: [],
        fx: [],
      },
    };
  });
  return {
    meta: doc.meta,
    theme,
    audio: { bgm: { src: audio.mix, volume: 1, duck: 1, fadeIn: false, ...(audio.credit && { credit: audio.credit }) } },
    durationInFrames: frame(total + tail),
    scenes,
    cast,
    skit: { format: doc.meta.format, style: doc.meta.style, subtitleStyle: doc.meta.subtitleStyle ?? "bold" },
    song: { bpm, warnings: audio.warnings },
  };
}

/** スライドの曲：解説動画の画面（見出し・部品・右に立ち絵・下に字幕）に、カラオケの歌詞と、拍に合わせて弾む歌う人 */
async function buildSlidesTimeline(doc: SceneDoc, theme: Theme, cast: CastMember[], audio: SongAudio): Promise<Timeline> {
  const { fps, bpm } = doc.meta;
  const sections = doc.scenes.map((s) => s.song!);
  const { starts, total } = songTimes(bpm, sections);
  const frame = (sec: number) => Math.round(sec * fps);
  const tail = 1.5;
  const name = singerName(doc.meta.singer);
  const scenes: ResolvedScene[] = [];
  for (const [si, scene] of doc.scenes.entries()) {
    const start = frame(starts[si]);
    const end = si === doc.scenes.length - 1 ? frame(total + tail) : frame(starts[si + 1]);
    // フレーズの番号（{n}）→ 文。休みだけのフレーズは文にならないので、番号で引けるようにする
    const byIndex = new Map<number, ResolvedScene["sentences"][number]>();
    for (const p of audio.phrases.filter((x) => x.scene === si)) {
      const from = frame(p.start) - start;
      byIndex.set(p.index, {
        text: scene.sentences[p.index].text,
        from,
        durationInFrames: Math.max(1, frame(p.end) - frame(p.start)),
        speaker: name,
        mouth: p.mouth.map(([a, b]): [number, number] => [from + frame(a), from + Math.max(frame(b), frame(a) + 1)]),
        karaoke: p.noteStarts.map((t) => frame(t) - start),
        ...(scene.sentences[p.index].face && { face: scene.sentences[p.index].face }),
      });
    }
    // 部品はフレーズの少し前（3 フレーム）に出して、歌い出しと同時に見えるようにする
    const at = (n: number | undefined) => (n === undefined ? 0 : Math.max(0, (byIndex.get(n - 1)?.from ?? 0) - 3));
    const elements = [];
    for (const el of scene.elements) elements.push(await resolveElement(el, at, theme.codeTheme, doc.meta.glossary));
    const onlyTitle = elements.length > 0 && elements.every((e) => e.type === "title");
    scenes.push({
      id: scene.id,
      heading: scene.heading,
      showHeading: !onlyTitle,
      start,
      durationInFrames: end - start,
      sentences: [...byIndex.values()].sort((a, b) => a.from - b.from),
      elements,
    });
  }
  return {
    meta: doc.meta,
    theme,
    audio: { bgm: { src: audio.mix, volume: 1, duck: 1, fadeIn: false, ...(audio.credit && { credit: audio.credit }) } },
    durationInFrames: frame(total + tail),
    scenes,
    character: cast[0]?.character,
    song: { bpm, warnings: audio.warnings },
  };
}
