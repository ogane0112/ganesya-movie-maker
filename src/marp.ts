// F11: Marp スライドを台本の下書きにする（スライド1枚 = 1シーン）。
//
// - 見出し → シーンの見出し。1枚目（または _class: lead）の見出しだけのスライドは :::title
// - 箇条書き → :::bullets、コード → :::code、$$…$$ → :::math、画像 → :::image、引用 → :::callout、地の文 → :::text
// - 発表者ノート（Marp の指示でない <!-- --> コメント）→ ナレーション
// - ノートがないスライドは、スライドの文を並べた仮のナレーションにする（話し言葉に直すのは人か AI の仕事）
//
// 変換できないもの（表・背景画像・量の多すぎる箇条書きやコード）は <!-- 要確認: … --> として台本に残す。
import { splitSentences } from "./parse.js";

/** Marp の指示（コメントに書くもの）。これ以外のコメントは発表者ノート */
const DIRECTIVES = new Set([
  "theme", "style", "headingDivider", "size", "math", "title", "author", "description", "image", "keywords", "url", "lang",
  "paginate", "header", "footer", "class", "backgroundColor", "backgroundImage", "backgroundPosition", "backgroundRepeat",
  "backgroundSize", "color", "marp", "transition", "footnote",
]);

const LIMITS = { bullets: 6, codeLines: 14 };

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "code"; lang: string; lines: string[] }
  | { kind: "math"; tex: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "quote"; text: string }
  | { kind: "text"; text: string }
  | { kind: "todo"; text: string };

export type Slide = { blocks: Block[]; notes: string[]; lead: boolean };

export type MarpOptions = {
  voice?: string;
  character?: string;
  /** 画像のパスを書き換える（スライドからの相対 → 台本からの相対） */
  imagePath?: (src: string) => string;
};

export type MarpResult = { script: string; slides: number; scenes: number; drafted: number; todos: string[] };

export function marpToScript(source: string, opts: MarpOptions = {}): MarpResult {
  const { meta, body } = splitFrontMatter(source.replace(/\r\n/g, "\n"));
  const slides = splitSlides(body).map(parseSlide);
  const title = meta.title ?? firstHeading(slides) ?? "（題名）";
  const out: string[] = [
    "---",
    `title: ${yamlString(title)}`,
    `voice: ${opts.voice ?? "zundamon"}`,
    `character: ${opts.character ?? "zundamon"}`,
    "subtitles: burn",
    "---",
    "",
    "<!-- gmm marp で作った下書き。ナレーションを話し言葉に直し、gmm terms で専門用語を洗い出して glossary: に書く -->",
  ];
  const todos: string[] = [];
  let scenes = 0;
  let drafted = 0;
  slides.forEach((slide, i) => {
    const r = slideToScene(slide, i, opts);
    if (!r) return;
    scenes++;
    if (r.drafted) drafted++;
    todos.push(...r.todos.map((t) => `${scenes}枚目（${r.heading}）: ${t}`));
    out.push("", ...r.lines);
  });
  return { script: out.join("\n") + "\n", slides: slides.length, scenes, drafted, todos };
}

function splitFrontMatter(src: string): { meta: Record<string, string>; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: src };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { meta, body: src.slice(m[0].length) };
}

/** --- の行でスライドに分ける（コードブロックの中は除く） */
function splitSlides(body: string): string[][] {
  const slides: string[][] = [[]];
  let fence: string | undefined;
  for (const line of body.split("\n")) {
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) fence = fence ? (line.trim().startsWith(fence) ? undefined : fence) : f[1];
    if (!fence && /^(---|\*\*\*|___)\s*$/.test(line)) slides.push([]);
    else slides[slides.length - 1].push(line);
  }
  return slides.filter((s) => s.some((l) => l.trim()));
}

export function parseSlide(lines: string[]): Slide {
  const blocks: Block[] = [];
  const notes: string[] = [];
  let lead = false;
  let para: string[] = [];
  const endPara = () => {
    if (para.length) blocks.push({ kind: "text", text: para.join("\n") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    // コメント（Marp の指示 or 発表者ノート）。複数行にまたがってもよい
    if (t.startsWith("<!--")) {
      endPara();
      let text = t;
      while (!text.includes("-->") && i + 1 < lines.length) text += "\n" + lines[++i];
      const inner = text.replace(/^<!--/, "").replace(/-->[\s\S]*$/, "").trim();
      const directive = inner.match(/^_?(\w+)\s*:\s*(.*)$/);
      if (directive && DIRECTIVES.has(directive[1]) && !inner.includes("\n")) {
        if (directive[1] === "class" && /\blead\b/.test(directive[2])) lead = true;
      } else if (inner) {
        notes.push(inner);
      }
      continue;
    }
    if (!t) {
      endPara();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(```+|~~~+)\s*([\w+-]*)/))) {
      endPara();
      const fence = m[1];
      const code: string[] = [];
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith(fence)) code.push(lines[++i]);
      i++;
      blocks.push({ kind: "code", lang: m[2] || "text", lines: code });
    } else if (t.startsWith("$$")) {
      endPara();
      const tex: string[] = [t.slice(2)];
      while (!tex.join("\n").includes("$$") && i + 1 < lines.length) tex.push(lines[++i]);
      blocks.push({ kind: "math", tex: tex.join("\n").replace(/\$\$/g, "").trim() });
    } else if ((m = t.match(/^(#{1,6})\s+(.+?)\s*#*$/))) {
      endPara();
      blocks.push({ kind: "heading", level: m[1].length, text: inline(m[2]) });
    } else if (/^([-*+]|\d+[.)])\s+/.test(t)) {
      endPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        const depth = (lines[i].match(/^\s*/)![0].length / 2) | 0;
        const item = inline(lines[i].trim().replace(/^([-*+]|\d+[.)])\s+/, ""));
        // 入れ子の項目は親の項目に「：」でつなぐ（台本の箇条書きは1段だけ）
        if (depth > 0 && items.length) items[items.length - 1] += `（${item}）`;
        else items.push(item);
        i++;
      }
      i--;
      blocks.push({ kind: "bullets", items });
    } else if ((m = t.match(/^!\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)\s*$/))) {
      endPara();
      if (/(^|\s)bg(\s|$)/.test(m[1])) blocks.push({ kind: "todo", text: `背景画像 ${m[2]} は使っていません（必要なら :::image で出す）` });
      else blocks.push({ kind: "image", src: m[2], alt: m[1].replace(/\b(w|h|width|height):\S+/g, "").trim() });
    } else if (t.startsWith(">")) {
      endPara();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) q.push(inline(lines[i++].trim().replace(/^>\s?/, "")));
      i--;
      blocks.push({ kind: "quote", text: q.filter(Boolean).join("\n") });
    } else if (t.startsWith("|")) {
      endPara();
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++].trim());
      i--;
      // 表は「1列目：残りの列」の箇条書きにする（見出しの行と区切りの行は除く）
      const cells = (r: string) => r.replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
      const body = rows.filter((r, k) => k > 0 && !/^\|?\s*:?-{2,}/.test(r)).map(cells);
      blocks.push({ kind: "bullets", items: body.map((c) => `${c[0]}：${c.slice(1).join("／")}`) });
      blocks.push({ kind: "todo", text: `表（${cells(rows[0]).join("・")}）を箇条書きにしました。列の意味が伝わるか確かめる` });
    } else {
      para.push(inline(t));
    }
  }
  endPara();
  return { blocks, notes, lead };
}

/** 行内の Markdown 記法を外す（$…$ の数式はそのまま） */
function inline(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "$1$2")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function firstHeading(slides: Slide[]): string | undefined {
  for (const s of slides) for (const b of s.blocks) if (b.kind === "heading") return b.text;
}

function slideToScene(slide: Slide, index: number, opts: MarpOptions) {
  const todos: string[] = [];
  const headings = slide.blocks.filter((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading");
  let content: Block[] = slide.blocks.filter((b) => b.kind !== "heading");
  if (!headings.length && !content.length) return undefined;
  const heading = headings[0]?.text ?? `スライド${index + 1}`;

  // 表紙：1枚目か lead のスライドで、見出しと短い文だけのもの
  const isTitle =
    (index === 0 || slide.lead) && content.every((b) => b.kind === "text" || b.kind === "todo") && content.filter((b) => b.kind === "text").length <= 1;

  // ナレーション：発表者ノートがあればそれを、なければスライドの文から仮に作る
  const fromNotes = splitSentences(slide.notes.join("\n"));
  const drafted = fromNotes.length === 0;
  const sentences = drafted ? draftNarration(heading, slide, isTitle) : fromNotes;
  const K = sentences.length;
  const clamp = (n: number) => Math.max(1, Math.min(n, K));

  const lines: string[] = [`## ${heading}`, ""];
  if (drafted) lines.push("<!-- 下書き: 発表者ノートがないので、スライドの文を並べただけです。話し言葉に直す -->");
  lines.push(...sentences, "");

  if (isTitle) {
    const sub = headings[1]?.text ?? (content.find((b) => b.kind === "text") as { text: string } | undefined)?.text.split("\n")[0];
    lines.push(":::title", heading, ...(sub ? [sub] : []), ":::");
    for (const b of content) if (b.kind === "todo") todos.push(b.text);
  } else {
    // 部品は話の順に出す。仮のナレーションは部品と同じ順に作るので、文の番号がそのまま合う
    let p = drafted ? 2 : 1; // 仮のナレーションの1文目は見出しの文
    // 2つ目以降の見出しは本文として先に出す（仮のナレーションも同じ順）
    content = [...headings.slice(1).map((h): Block => ({ kind: "text", text: h.text })), ...content];
    // 仮のナレーションでは、本文・引用は文の数だけ進む
    const step = (text: string) => (drafted ? Math.max(1, splitSentences(text.replace(/\n+/g, " ")).length) : 1);
    for (const b of content) {
      switch (b.kind) {
        case "bullets": {
          if (b.items.length > LIMITS.bullets) todos.push(`箇条書きが${b.items.length}項目あります（${LIMITS.bullets}項目まで）。絞るかシーンを分ける`);
          lines.push(":::bullets", ...b.items.map((it, k) => `- {${clamp(p + k)}} ${it}`), ":::", "");
          p = clamp(p + b.items.length);
          break;
        }
        case "code":
          if (b.lines.length > LIMITS.codeLines) todos.push(`コードが${b.lines.length}行あります（${LIMITS.codeLines}行まで）。要点の行に絞る`);
          lines.push(`:::code lang=${b.lang} {${clamp(p)}}`, ...b.lines, ":::", "");
          p = clamp(p + 1);
          break;
        case "math":
          lines.push(`:::math {${clamp(p)}}`, b.tex, ":::", "");
          p = clamp(p + 1);
          break;
        case "image": {
          const src = opts.imagePath ? opts.imagePath(b.src) : b.src;
          lines.push(`:::image src=${src} {${clamp(p)}}`, ...(b.alt ? [b.alt] : []), ":::", "");
          if (/^https?:/.test(b.src)) todos.push(`画像 ${b.src} はネット上のものです。手元に保存してパスを書き換える`);
          p = clamp(p + 1);
          break;
        }
        case "quote":
          lines.push(`:::callout {${clamp(p)}}`, b.text, ":::", "");
          p = clamp(p + step(b.text));
          break;
        case "text":
          lines.push(`:::text {${clamp(p)}}`, b.text, ":::", "");
          p = clamp(p + step(b.text));
          break;
        case "todo":
          todos.push(b.text);
          break;
      }
    }
  }
  for (const t of todos) lines.push(`<!-- 要確認: ${t} -->`);
  while (lines[lines.length - 1] === "") lines.pop();
  return { lines, heading, drafted, todos };
}

/** 発表者ノートがないときの仮のナレーション。部品と同じ順に1つずつ文にする */
function draftNarration(heading: string, slide: Slide, isTitle: boolean): string[] {
  const end = (s: string) => (/[。！？!?]$/.test(s) ? s : `${s}。`);
  const flat = (s: string) => s.replace(/\$[^$]*\$/g, "数式").replace(/\n+/g, " ");
  if (isTitle) return [end(`${heading}について解説します`)];
  const out = [end(`${heading}について見ていきます`)];
  const headings = slide.blocks.filter((b) => b.kind === "heading").slice(1);
  for (const h of headings) out.push(end(flat((h as { text: string }).text)));
  for (const b of slide.blocks) {
    if (b.kind === "bullets") out.push(...b.items.map((it) => end(flat(it))));
    else if (b.kind === "code") out.push("コードを見てみます。");
    else if (b.kind === "math") out.push("式で書くと、こうなります。");
    else if (b.kind === "image") out.push(end(b.alt ? flat(b.alt) : "図を見てみます"));
    else if (b.kind === "quote" || b.kind === "text") out.push(...splitSentences(flat(b.text)).map(end));
  }
  return out;
}

function yamlString(s: string): string {
  return /[:#"'{}[\],&*?|<>=!%@`]/.test(s) ? JSON.stringify(s) : s;
}
