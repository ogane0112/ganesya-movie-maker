// F8: SRT 字幕。表示区間は焼き込み字幕（remotion/Subtitle.tsx）と同じ。
import type { Timeline } from "./schema.js";

/** 文ごとの表示区間（動画全体でのフレーム） */
export function subtitleCues(t: Timeline): { from: number; to: number; text: string }[] {
  const cues: { from: number; to: number; text: string }[] = [];
  for (const scene of t.scenes) {
    scene.sentences.forEach((s, i) => {
      const next = scene.sentences[i + 1];
      const to = next ? next.from : Math.min(s.from + s.durationInFrames + 9, scene.durationInFrames);
      cues.push({ from: scene.start + s.from, to: scene.start + to, text: s.text });
    });
  }
  return cues;
}

export function toSrt(t: Timeline): string {
  const fps = t.meta.fps;
  const time = (frame: number) => {
    const ms = Math.round((frame / fps) * 1000);
    const pad = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
  };
  return subtitleCues(t)
    .map((c, i) => `${i + 1}\n${time(c.from)} --> ${time(c.to)}\n${c.text}\n`)
    .join("\n");
}
