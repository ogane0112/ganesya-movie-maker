// モーション動画のタイムライン。場面の切れ目は拍（bpm）にそろえる。
// 場面の長さは beats= の拍数か、ナレーションの長さを拍に切り上げたもの。部品は {n}（文）か {beat:n}（拍）で出す。
import type { Theme } from "../../remotion/theme.js";
import type { AudioTiming, CastMember, ResolvedScene, SceneDoc, Timeline, TimelineAudio } from "../schema.js";
import type { MotionElement, ResolvedMotionElement, Transition } from "./schema.js";

/** ナレーションの頭の間・文の間・お尻の余韻（秒） */
export const MOTION_PACING = { leadIn: 0.3, gap: 0.3, tail: 0.5 };

/** 入り方ごとの効果音（public/se/ の名前）。cut と fade は鳴らさない */
export const TRANSITION_SE: Partial<Record<Transition, string>> = {
  wipe: "se/whoosh.wav",
  slide: "se/whoosh.wav",
  zoom: "se/whoosh.wav",
  flash: "se/impact.wav",
  glitch: "se/impact.wav",
};

/** 場面のコード（:::custom の src）の登録名 */
export const customId = (src: string) => "c_" + src.replace(/[^A-Za-z0-9]/g, "_");

export function buildMotionTimeline(
  doc: SceneDoc,
  audio: AudioTiming,
  theme: Theme,
  audioAssets: TimelineAudio = {},
  cast?: CastMember[],
): Timeline {
  const { fps, bpm } = doc.meta;
  const fpb = (fps * 60) / bpm;
  const sec = (s: number) => Math.round(s * fps);
  /** 動画全体で b 拍目（0 始まり、小数可）のフレーム。丸めの誤差がたまらないよう、毎回 0 から数える */
  const beatFrame = (b: number) => Math.round(b * fpb);

  const scenes: ResolvedScene[] = [];
  let B = 0; // いまの場面の頭の拍
  for (const scene of doc.scenes) {
    const clips = audio.sentences.filter((a) => a.sceneId === scene.id).sort((a, b) => a.index - b.index);
    let cursor = sec(MOTION_PACING.leadIn);
    const sentences = clips.map((c, i) => {
      const from = i === 0 ? cursor : cursor + sec(MOTION_PACING.gap);
      const durationInFrames = Math.max(1, Math.ceil(c.seconds * fps));
      cursor = from + durationInFrames;
      const s = scene.sentences[i];
      const mouth = c.mouth.map(([a, b]): [number, number] => [from + Math.round(a * fps), from + Math.max(Math.round(b * fps), Math.round(a * fps) + 1)]);
      return {
        text: c.text,
        from,
        durationInFrames,
        audio: c.file,
        mouth,
        ...(s.speaker && { speaker: s.speaker }),
        ...(s.explains?.length && { explains: s.explains }),
      };
    });
    const narration = sentences.length ? cursor + sec(MOTION_PACING.tail) : 0;
    const beats = scene.beats ?? Math.max(1, Math.ceil(narration / fpb));
    const start = beatFrame(B);
    const durationInFrames = beatFrame(B + beats) - start;
    /** 場面の b 拍目（1 始まり）のフレーム（場面の頭から） */
    const beatAt = (b: number) => beatFrame(B + b - 1) - start;
    const when = (t: { at?: number; beat?: number }, fallback: number) =>
      t.at !== undefined ? (sentences[t.at - 1]?.from ?? 0) : t.beat !== undefined ? beatAt(t.beat) : fallback;

    const checks = new Set<number>([durationInFrames - 1]);
    const settle = Math.min(Math.round(fpb * 0.75), sec(0.6)); // 出てから落ち着くまで
    const mark = (f: number) => checks.add(Math.min(durationInFrames - 1, f + settle));
    const motion = (scene.motion ?? []).map((el) => resolve(el, when, fpb, mark));
    scenes.push({
      id: scene.id,
      heading: scene.heading,
      showHeading: false,
      start,
      durationInFrames,
      sentences,
      elements: [],
      motion,
      beatFrames: Array.from({ length: Math.ceil(beats) }, (_, k) => beatAt(k + 1)),
      transition: scene.transition ?? "cut",
      checkFrames: [...checks].sort((a, b) => a - b),
      ...(scenes.length > 0 && TRANSITION_SE[scene.transition ?? "cut"] && { se: TRANSITION_SE[scene.transition ?? "cut"] }),
    });
    B += beats;
  }
  const total = beatFrame(B);
  return {
    meta: doc.meta,
    theme,
    audio: audioAssets,
    durationInFrames: total,
    scenes,
    motion: { bpm, framesPerBeat: fpb },
    ...(cast?.length && { cast }),
  };
}

function resolve(
  el: MotionElement,
  when: (t: { at?: number; beat?: number }, fallback: number) => number,
  fpb: number,
  mark: (frame: number) => void,
): ResolvedMotionElement {
  const from = when(el, 0);
  mark(from);
  const { at: _a, beat: _b, ...rest } = el;
  switch (el.type) {
    case "kinetic": {
      const lines = sequence(el.lines, from, el.every, fpb, when, mark).map((l) => ({ text: l.text, from: l.from }));
      return { ...(rest as Omit<typeof el, "at" | "beat">), from, lines };
    }
    case "terminal": {
      // コマンド（$ の行）は打ち込むのに時間がかかるので、打ち終わりも測る
      const lines = sequence(el.lines, from, el.every, fpb, when, mark).map((l) => {
        if (l.text.startsWith("$")) mark(l.from + typingFrames(l.text));
        return { text: l.text, from: l.from };
      });
      return { ...(rest as Omit<typeof el, "at" | "beat">), from, lines };
    }
    case "history": {
      const items = sequence(el.items, from, el.every, fpb, when, mark).map((it) => ({ label: it.label, text: it.text, from: it.from }));
      return { ...(rest as Omit<typeof el, "at" | "beat">), from, items };
    }
    case "features": {
      const items = sequence(el.items, from, el.every, fpb, when, mark).map((it) => ({ title: it.title, text: it.text, from: it.from }));
      return { ...(rest as Omit<typeof el, "at" | "beat">), from, items };
    }
    case "editor":
      mark(Math.round(from + (el.typing ? el.beats : 0) * fpb));
      return { ...rest, from } as ResolvedMotionElement;
    case "counter":
    case "chart":
      // 伸びきった所も測る
      mark(Math.round(from + el.beats * fpb));
      return { ...rest, from } as ResolvedMotionElement;
    case "custom":
      return { ...(rest as Omit<typeof el, "at" | "beat">), from, id: customId(el.src) };
    default:
      return { ...rest, from } as ResolvedMotionElement;
  }
}

/** コマンドを打ち込むのにかかるフレーム数（1文字 1.2 フレーム。remotion/motion/ui.tsx と同じ） */
export const typingFrames = (text: string) => Math.ceil([...text.replace(/^\$\s*/, "")].length * 1.2);

/**
 * 行・項目の時刻。時刻のない行は、直前の時刻のある行（なければ部品の頭）から every 拍ごと。
 * 丸めの誤差がたまらないよう、起点から数える
 */
function sequence<T extends { at?: number; beat?: number }>(
  list: T[],
  from: number,
  every: number,
  fpb: number,
  when: (t: { at?: number; beat?: number }, fallback: number) => number,
  mark: (frame: number) => void,
): (T & { from: number })[] {
  let anchor = from;
  let count = 0;
  return list.map((it, i) => {
    const explicit = it.at !== undefined || it.beat !== undefined;
    const f = explicit ? when(it, from) : i === 0 ? from : anchor + Math.round((count + 1) * every * fpb);
    if (explicit || i === 0) (anchor = f), (count = 0);
    else count++;
    mark(f);
    return { ...it, from: f };
  });
}
