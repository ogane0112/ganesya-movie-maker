// F3: 音声の長さからタイミングを決め、レンダリング用の timeline.json を作る。
// 部品の出現・強調は「対応するナレーション文の開始フレーム」に合わせる。
import { codeToTokens } from "shiki";
import { getTheme } from "../remotion/theme.js";
import type { AudioTiming, Element, ResolvedElement, ResolvedScene, SceneDoc, Timeline } from "./schema.js";

/** シーン冒頭の間・文と文の間・シーン末尾の余韻（秒） */
export const PACING = { leadIn: 0.4, gap: 0.35, tail: 1.0 };

export async function buildTimeline(doc: SceneDoc, audio: AudioTiming): Promise<Timeline> {
  const { fps } = doc.meta;
  const theme = getTheme(doc.meta.theme);
  const sec = (s: number) => Math.round(s * fps);

  const scenes: ResolvedScene[] = [];
  let start = 0;
  for (const scene of doc.scenes) {
    const clips = audio.sentences.filter((a) => a.sceneId === scene.id).sort((a, b) => a.index - b.index);
    if (clips.length !== scene.sentences.length) {
      throw new Error(`シーン ${scene.id} の音声が揃っていません。gmm tts をやり直してください`);
    }
    let cursor = sec(PACING.leadIn);
    const sentences = clips.map((c, i) => {
      const from = i === 0 ? cursor : cursor + sec(PACING.gap);
      const durationInFrames = Math.max(1, Math.ceil(c.seconds * fps));
      cursor = from + durationInFrames;
      return { text: c.text, from, durationInFrames, audio: c.file };
    });
    const durationInFrames = cursor + sec(PACING.tail);
    const at = (n: number | undefined) => (n === undefined ? 0 : sentences[n - 1].from);

    const elements: ResolvedElement[] = [];
    for (const el of scene.elements) elements.push(await resolveElement(el, at, theme.codeTheme));

    scenes.push({
      id: scene.id,
      heading: scene.heading,
      showHeading: scene.showHeading,
      start,
      durationInFrames,
      sentences,
      elements,
    });
    start += durationInFrames;
  }
  return { meta: doc.meta, durationInFrames: start, scenes };
}

async function resolveElement(
  el: Element,
  at: (n: number | undefined) => number,
  codeTheme: string,
): Promise<ResolvedElement> {
  switch (el.type) {
    case "bullets": {
      const items = el.items.map((it) => ({
        text: it.text,
        from: at(it.at),
        emphasisFrom: it.emphasisAt === undefined ? undefined : at(it.emphasisAt),
      }));
      return { type: "bullets", from: Math.min(...items.map((x) => x.from)), items };
    }
    case "code": {
      const result = await codeToTokens(el.code, { lang: el.lang as never, theme: codeTheme as never }).catch(() =>
        codeToTokens(el.code, { lang: "text", theme: codeTheme as never }),
      );
      return {
        type: "code",
        from: at(el.at),
        lang: el.lang,
        code: el.code,
        lines: result.tokens.map((line) => line.map((t) => ({ content: t.content, color: t.color }))),
        background: result.bg ?? "#1e1e1e",
        highlights: el.highlights.map((h) => ({ from: at(h.at), lines: h.lines })),
      };
    }
    case "title":
      return { type: "title", title: el.title, subtitle: el.subtitle, from: at(el.at) };
    case "text":
      return { type: "text", text: el.text, variant: el.variant, from: at(el.at) };
  }
}
