// F3: 音声の長さからタイミングを決め、レンダリング用の timeline.json を作る。
// 部品の出現・強調は「対応するナレーション文の開始フレーム」に合わせる。
import katex from "katex";
import { codeToTokens } from "shiki";
import type { Theme } from "../remotion/theme.js";
import type {
  AudioTiming,
  CastMember,
  Element,
  ResolvedCharacter,
  ResolvedElement,
  ResolvedScene,
  SceneDoc,
  Timeline,
  TimelineAudio,
} from "./schema.js";

/** シーン冒頭の間・文と文の間・シーン末尾の余韻（秒） */
export const PACING = { leadIn: 0.4, gap: 0.35, tail: 1.0 };

export async function buildTimeline(
  doc: SceneDoc,
  audio: AudioTiming,
  theme: Theme,
  character?: ResolvedCharacter,
  audioAssets: TimelineAudio = {},
  /** 掛け合い（speakers:）の話者。あれば立ち絵・表情は話者ごと */
  cast?: CastMember[],
): Promise<Timeline> {
  const { fps } = doc.meta;
  const sec = (s: number) => Math.round(s * fps);

  const scenes: ResolvedScene[] = [];
  let start = 0;
  let face = character?.defaultFace;
  // 掛け合いでは表情は話者ごとに続く
  const faceOf: Record<string, string | undefined> = {};
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
      const speaker = scene.sentences[i].speaker;
      if (cast && speaker) faceOf[speaker] = scene.sentences[i].face ?? faceOf[speaker];
      else face = scene.sentences[i].face ?? face; // 表情は次の指定まで続く
      const mouth = c.mouth.map(([a, b]): [number, number] => [from + Math.round(a * fps), from + Math.max(Math.round(b * fps), Math.round(a * fps) + 1)]);
      const explains = [
        ...(scene.sentences[i].explains ?? []),
        // 用語カードは、出る文（省略時は1文目）でその用語を説明したことにする
        ...scene.elements.filter((e) => e.type === "term" && (e.at ?? 1) === i + 1).map((e) => (e as { term: string }).term),
      ];
      return {
        text: c.text,
        from,
        durationInFrames,
        audio: c.file,
        face: cast && speaker ? faceOf[speaker] : face,
        mouth,
        ...(speaker && { speaker }),
        ...(explains.length && { explains }),
      };
    });
    const durationInFrames = cursor + sec(PACING.tail);
    const at = (n: number | undefined) => (n === undefined ? 0 : sentences[n - 1].from);

    const elements: ResolvedElement[] = [];
    for (const el of scene.elements) elements.push(await resolveElement(el, at, theme.codeTheme, doc.meta.glossary));

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
  return { meta: doc.meta, theme, audio: audioAssets, durationInFrames: start, scenes, ...(cast ? { cast } : { character }) };
}

async function resolveElement(
  el: Element,
  at: (n: number | undefined) => number,
  codeTheme: string,
  glossary: Record<string, string>,
): Promise<ResolvedElement> {
  switch (el.type) {
    case "bullets": {
      const items = el.items.map((it) => ({
        text: it.text,
        html: richText(it.text),
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
      return { type: "text", text: el.text, html: richText(el.text), variant: el.variant, from: at(el.at) };
    case "math":
      return { type: "math", tex: el.tex, html: tex(el.tex, true), from: at(el.at) };
    case "term":
      return { type: "term", term: el.term, description: el.description ?? glossary[el.term] ?? "", from: at(el.at) };
    case "image":
      return { type: "image", src: el.src, caption: el.caption, from: at(el.at) };
    case "diagram": {
      const nodes = el.nodes.map((n) => ({
        text: n.text,
        from: at(n.at),
        emphasisFrom: n.emphasisAt === undefined ? undefined : at(n.emphasisAt),
      }));
      // 矢印は、指定がなければ両端の箱がそろったときに出す
      const edges = el.edges.map((e, i) =>
        e && { arrow: e.arrow, label: e.label, from: e.at === undefined ? Math.max(nodes[i].from, nodes[i + 1].from) : at(e.at) },
      );
      return { type: "diagram", direction: el.direction, from: Math.min(...nodes.map((n) => n.from)), nodes, edges };
    }
  }
}

function tex(src: string, display: boolean): string {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: true, output: "html" });
  } catch (e) {
    throw new Error(`数式を描けません「${src}」: ${(e as Error).message}`);
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 本文中の $…$ を KaTeX のインライン数式にし、それ以外はエスケープした HTML を返す */
export function richText(text: string): string {
  return text
    .split(/(\$[^$\n]+\$)/)
    .map((part) => (/^\$[^$]+\$$/.test(part) ? tex(part.slice(1, -1), false) : escapeHtml(part)))
    .join("");
}
