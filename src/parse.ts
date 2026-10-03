// F1: Markdown台本 → シーン定義JSON
//
//   ---            フロントマター（title / theme / voice / speed）
//   ## 見出し      シーンの区切り
//   地の文         ナレーション（。！？ と改行で文に分ける）
//   :::部品名 引数 画面に出すもの（::: で閉じる）
//   {n}            n番目のナレーション文が始まるときに出す
//   {face:smile}   文頭に書くと、その文から立ち絵の表情が変わる
//   {表記|よみ}    字幕には表記、読み上げにはよみを使う（フロントマターの readings: で一括指定もできる）
import { Element, SceneDoc, type Scene } from "./schema.js";

export class ScriptError extends Error {
  constructor(public readonly problems: string[]) {
    super(problems.join("\n"));
  }
}

type BlockArgs = { at?: number; params: Record<string, string> };

export function parseScript(source: string): SceneDoc {
  const problems: string[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  // フロントマター
  // 値が空のキーの下に字下げした「キー: 値」を並べると、その組の表（readings など）になる
  const meta: Record<string, string | number | Record<string, string>> = {};
  if (lines[0]?.trim() === "---") {
    i = 1;
    let table: Record<string, string> | undefined;
    while (i < lines.length && lines[i].trim() !== "---") {
      const nested = table && lines[i].match(/^\s+(.+?)\s*:\s*(.+)$/);
      const m = lines[i].match(/^(\w+)\s*:\s*(.*?)\s*(#.*)?$/);
      if (nested) table![nested[1].replace(/^["'](.*)["']$/, "$1")] = String(coerce(nested[2].trim()));
      else if (m && m[2] === "") meta[m[1]] = table = {};
      else if (m) (meta[m[1]] = coerce(m[2])), (table = undefined);
      i++;
    }
    i++;
  }

  const scenes: Scene[] = [];
  let current: { heading: string; line: number; narration: string[]; elements: { el: unknown; line: number }[] } | null = null;

  const flush = () => {
    if (!current) return;
    const sentences = takeFaces(splitSentences(current.narration.join("\n")));
    const elements: Element[] = [];
    for (const { el, line } of current.elements) {
      const parsed = Element.safeParse(el);
      if (!parsed.success) {
        problems.push(`${line}行目: 部品の指定が不正です: ${parsed.error.issues.map((x) => x.message).join(", ")}`);
        continue;
      }
      for (const n of referencedSentences(parsed.data)) {
        if (n > sentences.length) {
          problems.push(
            `${line}行目: {${n}} を指定していますが、シーン「${current.heading}」のナレーションは${sentences.length}文です`,
          );
        }
      }
      elements.push(parsed.data);
    }
    if (sentences.length === 0) {
      problems.push(`${current.line}行目: シーン「${current.heading}」にナレーションがありません`);
    }
    const onlyTitle = elements.length > 0 && elements.every((e) => e.type === "title");
    scenes.push({
      id: `s${String(scenes.length + 1).padStart(2, "0")}`,
      heading: current.heading,
      showHeading: !onlyTitle,
      sentences,
      elements,
    });
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flush();
      current = { heading: heading[1].trim(), line: i + 1, narration: [], elements: [] };
      continue;
    }
    const block = line.match(/^:::(\w+)\s*(.*)$/);
    if (block) {
      const start = i + 1;
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") body.push(lines[i++]);
      if (i >= lines.length) problems.push(`${start}行目: :::${block[1]} が閉じられていません`);
      if (!current) {
        problems.push(`${start}行目: ## 見出しより前に部品があります`);
        continue;
      }
      try {
        current.elements.push({ el: buildElement(block[1], parseArgs(block[2]), body), line: start });
      } catch (e) {
        problems.push(`${start}行目: ${(e as Error).message}`);
      }
      continue;
    }
    if (!current) continue; // 最初の見出しより前の地の文（# タイトルなど）は無視
    if (/^\s*<!--.*-->\s*$/.test(line)) continue;
    if (line.trim()) current.narration.push(line.trim());
  }
  flush();

  if (scenes.length === 0) problems.push("シーンがありません（## 見出し でシーンを始めてください）");
  if (problems.length) throw new ScriptError(problems);
  return SceneDoc.parse({ version: 1, meta, scenes });
}

/** 改行と 。！？ で文に分ける。句読点は文に含める。 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const parts = line.match(/[^。！？!?]+[。！？!?]*|[。！？!?]+/g) ?? [];
    for (const p of parts) {
      const s = p.trim();
      if (!s) continue;
      // 句読点だけの断片は直前の文にくっつける
      if (/^[。！？!?]+$/.test(s) && out.length) out[out.length - 1] += s;
      else out.push(s);
    }
  }
  return out;
}

/** {表記|よみ}: 字幕には表記を出し、読み上げはよみを使う */
const READING = /\{([^{}|]+)\|([^{}]+)\}/g;

/** 文頭の {face:表情} を取り出す。{face:x} だけの行は次の文に付ける */
function takeFaces(sentences: string[]): { text: string; speech?: string; face?: string }[] {
  const out: { text: string; speech?: string; face?: string }[] = [];
  let pending: string | undefined;
  for (const s of sentences) {
    const m = s.match(/^\{face:([\w-]+)\}\s*/);
    const raw = m ? s.slice(m[0].length) : s;
    const face = m?.[1] ?? pending;
    if (!raw) {
      pending = face;
      continue;
    }
    pending = undefined;
    const text = raw.replace(READING, "$1");
    out.push({ text, ...(text !== raw && { speech: raw.replace(READING, "$2") }), ...(face && { face }) });
  }
  return out;
}

function parseArgs(src: string): BlockArgs {
  const args: BlockArgs = { params: {} };
  const re = /(\w+)=("([^"]*)"|\S+)|(\{\d+\})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[4]) args.at = Number(m[4].slice(1, -1));
    else args.params[m[1]] = m[3] ?? m[2];
  }
  return args;
}

/** 行頭の {n} と、どこにでも書ける強調 {!n} を取り出す */
function takeMarkers(text: string): { text: string; at?: number; emphasisAt?: number } {
  let rest = text.trim();
  let at: number | undefined;
  let emphasisAt: number | undefined;
  const lead = rest.match(/^\{(\d+)\}\s*/);
  if (lead) {
    at = Number(lead[1]);
    rest = rest.slice(lead[0].length);
  }
  const em = rest.match(/\s*\{!(\d+)\}\s*/);
  if (em) {
    emphasisAt = Number(em[1]);
    rest = (rest.slice(0, em.index) + " " + rest.slice(em.index! + em[0].length)).trim();
  }
  return { text: rest, at, emphasisAt };
}

function buildElement(kind: string, args: BlockArgs, body: string[]): unknown {
  switch (kind) {
    case "bullets": {
      const items = body
        .filter((l) => /^\s*[-*]\s+/.test(l))
        .map((l) => takeMarkers(l.replace(/^\s*[-*]\s+/, "")));
      if (items.length === 0) throw new Error(":::bullets に箇条書き（- で始まる行）がありません");
      return { type: "bullets", items };
    }
    case "code": {
      return {
        type: "code",
        lang: args.params.lang ?? "text",
        code: dedent(body).join("\n"),
        at: args.at,
        highlights: parseHighlights(args.params.highlight ?? ""),
      };
    }
    case "title": {
      const text = body.map((l) => l.trim()).filter(Boolean);
      const first = takeMarkers(text[0] ?? "");
      return { type: "title", title: first.text, subtitle: text[1], at: args.at ?? first.at };
    }
    case "text":
    case "callout": {
      const t = takeMarkers(body.map((l) => l.trim()).filter(Boolean).join("\n"));
      return {
        type: "text",
        text: t.text,
        variant: kind === "callout" ? "callout" : (args.params.variant ?? "plain"),
        at: args.at ?? t.at,
      };
    }
    default:
      throw new Error(`未知の部品 :::${kind}（使えるのは title / bullets / code / text / callout）`);
  }
}

/** highlight="{1}:1 {2}:2-3,5" → [{at:1, lines:[1]}, {at:2, lines:[2,3,5]}] */
function parseHighlights(spec: string) {
  const out: { at: number; lines: number[] }[] = [];
  for (const part of spec.split(/\s+/).filter(Boolean)) {
    const m = part.match(/^\{(\d+)\}:([\d,-]+)$/);
    if (!m) throw new Error(`highlight の書式が不正です: ${part}（例: "{1}:1 {2}:2-3"）`);
    const lines: number[] = [];
    for (const r of m[2].split(",")) {
      const [a, b] = r.split("-").map(Number);
      for (let n = a; n <= (b ?? a); n++) lines.push(n);
    }
    out.push({ at: Number(m[1]), lines });
  }
  return out;
}

function referencedSentences(el: Element): number[] {
  switch (el.type) {
    case "bullets":
      return el.items.flatMap((x) => [x.at, x.emphasisAt]).filter((n): n is number => n !== undefined);
    case "code":
      return [el.at, ...el.highlights.map((h) => h.at)].filter((n): n is number => n !== undefined);
    default:
      return el.at === undefined ? [] : [el.at];
  }
}

function dedent(lines: string[]): string[] {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min));
}

function coerce(v: string): string | number {
  const unquoted = v.replace(/^["'](.*)["']$/, "$1");
  return /^-?\d+(\.\d+)?$/.test(unquoted) ? Number(unquoted) : unquoted;
}

