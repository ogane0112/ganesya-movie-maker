// F18: ゲーム実況のタイムライン。録画の時刻 → 出力のフレームの写像（カット・倍速）を作り、
// 区間（スプリット）ごとのシーンに分け、実況を待ち行列で並べる。
import type { Theme } from "../../remotion/theme.js";
import type {
  AudioTiming,
  CastMember,
  Edit,
  FootageSegment,
  ResolvedScene,
  ResolvedSentence,
  SceneDoc,
  Timeline,
  TimelineAudio,
} from "../schema.js";
import { formatTime, parseTime } from "./parse.js";

/** 発言と発言の間（秒）・最初の発言を始めるまで（秒） */
export const BIIM_PACING = { gap: 0.25, lead: 0.3 };

export type FootageInfo = { src: string; width: number; height: number; duration: number };

/** 録画をどう流すか（カットを除き、倍速区間を縮める）。from は出力のフレーム */
export function buildFootageMap(edits: Edit[], duration: number, fps: number): FootageSegment[] {
  const sorted = [...edits].sort((a, b) => a.from - b.from);
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (e.to > duration + 0.05) throw new Error(`!${e.type} ${formatTime(e.from)}-${formatTime(e.to)} が録画の長さ（${formatTime(duration)}）を越えています`);
    if (i > 0 && e.from < sorted[i - 1].to) throw new Error(`!${sorted[i - 1].type} と !${e.type}（${formatTime(e.from)}）の区間が重なっています`);
  }
  const pieces: { from: number; to: number; rate: number }[] = [];
  let v = 0;
  for (const e of sorted) {
    if (e.from > v) pieces.push({ from: v, to: e.from, rate: 1 });
    if (e.type === "fast") pieces.push({ from: e.from, to: e.to, rate: e.rate });
    v = e.to;
  }
  if (v < duration) pieces.push({ from: v, to: duration, rate: 1 });
  const out: FootageSegment[] = [];
  let at = 0;
  for (const p of pieces) {
    const durationInFrames = Math.round(((p.to - p.from) / p.rate) * fps);
    if (durationInFrames <= 0) continue;
    out.push({ from: at, durationInFrames, videoFrom: p.from, rate: p.rate });
    at += durationInFrames;
  }
  return out;
}

/** 録画の時刻 → 出力のフレーム。カットされた時刻は、カットの直後に寄せる（inCut で知らせる） */
export function videoToFrame(v: number, map: FootageSegment[], fps: number): { frame: number; inCut: boolean } {
  for (const s of map) {
    const end = s.videoFrom + (s.durationInFrames / fps) * s.rate;
    if (v < s.videoFrom) return { frame: s.from, inCut: true };
    if (v <= end) return { frame: s.from + Math.round(((v - s.videoFrom) / s.rate) * fps), inCut: false };
  }
  const last = map[map.length - 1];
  return { frame: last ? last.from + last.durationInFrames : 0, inCut: true };
}

/** 出力のフレーム → 録画の時刻 */
export function frameToVideo(frame: number, map: FootageSegment[], fps: number): number {
  for (const s of map) {
    if (frame < s.from + s.durationInFrames) return s.videoFrom + (Math.max(0, frame - s.from) / fps) * s.rate;
  }
  const last = map[map.length - 1];
  return last ? last.videoFrom + (last.durationInFrames / fps) * last.rate : 0;
}

export function buildBiimTimeline(
  doc: SceneDoc,
  audio: AudioTiming,
  theme: Theme,
  cast: CastMember[],
  footage: FootageInfo,
  audioAssets: TimelineAudio = {},
  gameGain = 1,
): Timeline {
  const { fps } = doc.meta;
  const sec = (s: number) => Math.round(s * fps);
  const runStart = parseTime(doc.meta.runStart!);
  const runEnd = parseTime(doc.meta.runEnd!);
  if (runEnd <= runStart) throw new Error("runEnd が runStart より前です");
  if (runEnd > footage.duration + 0.05) throw new Error(`runEnd（${formatTime(runEnd)}）が録画の長さ（${formatTime(footage.duration)}）を越えています`);

  const map = buildFootageMap(doc.edits, footage.duration, fps);
  const total = map.reduce((n, s) => n + s.durationInFrames, 0);

  // 発言を待ち行列で並べる（動画全体のフレーム）
  type Placed = ResolvedSentence & { sceneIndex: number; start: number };
  const placed: Placed[] = [];
  let cursor = sec(BIIM_PACING.lead) - sec(BIIM_PACING.gap);
  const faceOf: Record<string, string | undefined> = {};
  doc.scenes.forEach((scene, si) => {
    const clips = audio.sentences.filter((a) => a.sceneId === scene.id).sort((a, b) => a.index - b.index);
    scene.sentences.forEach((s, i) => {
      const c = clips[i];
      let anchor: number | undefined;
      if (s.at !== undefined) {
        const m = videoToFrame(s.at, map, fps);
        if (m.inCut) throw new Error(`@${formatTime(s.at)} の発言「${s.text.slice(0, 15)}」が !cut の区間の中です`);
        anchor = m.frame;
      }
      const start = Math.max(anchor ?? 0, cursor + sec(BIIM_PACING.gap));
      const durationInFrames = Math.max(1, Math.ceil(c.seconds * fps));
      cursor = start + durationInFrames;
      const speaker = s.speaker ?? "";
      faceOf[speaker] = s.face ?? faceOf[speaker];
      placed.push({
        sceneIndex: si,
        start,
        text: c.text,
        from: start,
        durationInFrames,
        audio: c.file,
        speaker: s.speaker,
        face: faceOf[speaker],
        mouth: c.mouth.map(([a, b]): [number, number] => [start + Math.round(a * fps), start + Math.max(Math.round(b * fps), Math.round(a * fps) + 1)]),
        anchor,
        explains: s.explains,
      });
    });
  });

  // シーン（区間）の境目
  const bounds = doc.scenes.map((s, i) => {
    if (s.splitAt === undefined) return 0;
    const m = videoToFrame(s.splitAt, map, fps);
    return i === 0 ? 0 : m.frame;
  });
  bounds.forEach((b, i) => {
    if (i > 0 && b <= bounds[i - 1]) throw new Error(`区間「${doc.scenes[i].heading}」が前の区間と同じ位置です（!cut の中に区間の開始がないか確かめてください）`);
  });

  const scenes: ResolvedScene[] = doc.scenes.map((scene, i) => {
    const start = bounds[i];
    const end = i + 1 < bounds.length ? bounds[i + 1] : total;
    const rel = (f: number) => f - start;
    // 録画のうち、このシーンに入る部分
    const footageSegs: FootageSegment[] = [];
    for (const s of map) {
      const a = Math.max(start, s.from);
      const b = Math.min(end, s.from + s.durationInFrames);
      if (b <= a) continue;
      footageSegs.push({ from: rel(a), durationInFrames: b - a, videoFrom: s.videoFrom + ((a - s.from) / fps) * s.rate, rate: s.rate });
    }
    // このシーンで始まる発言と、前のシーンから続いている発言（字幕だけ）
    const sentences: ResolvedSentence[] = placed
      .filter((p) => (p.start >= start && p.start < end) || (p.start < start && p.start + p.durationInFrames > start))
      .map(({ sceneIndex: _, start: s0, ...p }) => ({
        ...p,
        from: rel(p.from),
        mouth: p.mouth.map(([a, b]) => [rel(a), rel(b)] as [number, number]),
        ...(p.anchor !== undefined && { anchor: rel(p.anchor) }),
        ...(s0 < start && { carry: true, audio: undefined }),
      }));
    return {
      id: scene.id,
      heading: scene.heading,
      showHeading: false,
      start,
      globalStart: start,
      durationInFrames: end - start,
      sentences,
      elements: [],
      footage: footageSegs,
    };
  });

  const splitScenes = doc.scenes.filter((s) => s.splitAt !== undefined);
  return {
    meta: doc.meta,
    theme,
    audio: audioAssets,
    durationInFrames: total,
    scenes,
    cast,
    run: {
      video: footage.src,
      width: footage.width,
      height: footage.height,
      category: doc.meta.category,
      runStart,
      runEnd,
      splits: splitScenes.map((s, i) => ({
        name: s.heading,
        endRunTime: Math.max(0, (i + 1 < splitScenes.length ? splitScenes[i + 1].splitAt! : runEnd) - runStart),
      })),
      footage: map,
      gameVolume: doc.meta.gameVolume * gameGain,
    },
  };
}
