// モーション動画（layout: motion）の台本パーサ。
//
//   ---                         フロントマター（layout: motion / bpm / bgm: synth:drive / theme …）
//   ## 名前 beats=8 transition=zoom   場面。beats: 長さ（拍）。省略時はナレーションの長さを拍に切り上げる
//   ナレーション（任意）          。！？と改行で文に分かれる（speakers: があれば「話者: 文」）
//   :::kinetic {beat:1}          部品。{n}: n 番目の文で出す / {beat:n}: 場面の n 拍目に出す
//   - **大きな**文字
//   :::
//
// 部品の一覧は src/motion/schema.ts、書き方は docs/motion.md。
import { parseFrontMatter, ScriptError, splitSentences, takeSentenceMarkers } from "../parse.js";
import { SceneDoc, type Scene } from "../schema.js";
import { MotionElement, Transition } from "./schema.js";

type Timing = { at?: number; beat?: number };

/** 行頭の {n} / {beat:n} を取り出す */
function takeTiming(text: string): Timing & { text: string } {
  let rest = text.trim();
  const t: Timing = {};
  for (;;) {
    const m = rest.match(/^\{(?:(\d+)|beat:(\d+(?:\.\d+)?))\}\s*/);
    if (!m) break;
    if (m[1]) t.at = Number(m[1]);
    else t.beat = Number(m[2]);
    rest = rest.slice(m[0].length);
  }
  return { ...t, text: rest };
}

/** 部品の引数: key=value / key="value with space" / {n} / {beat:n} */
function parseArgs(src: string): { timing: Timing; params: Record<string, string> } {
  const timing: Timing = {};
  const params: Record<string, string> = {};
  const re = /(\w+)=("([^"]*)"|\S+)|\{(\d+)\}|\{beat:(\d+(?:\.\d+)?)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[4]) timing.at = Number(m[4]);
    else if (m[5]) timing.beat = Number(m[5]);
    else params[m[1]] = m[3] ?? m[2];
  }
  return { timing, params };
}

const num = (v: string | undefined, name: string): number | undefined => {
  if (v === undefined) return undefined;
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new Error(`${name}= は数で書いてください: ${v}`);
  return n;
};

const items = (body: string[]) => body.map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^[-*]\s+/, ""));

export function buildMotionElement(kind: string, argsSrc: string, body: string[]): MotionElement {
  const { timing, params: p } = parseArgs(argsSrc);
  const base = { ...timing, area: p.area };
  const el = (() => {
    switch (kind) {
      case "kinetic":
        return {
          type: kind,
          lines: items(body).map(takeTiming),
          style: p.style,
          mode: p.mode,
          every: num(p.every, "every"),
          size: num(p.size, "size"),
          ...base,
        };
      case "counter":
        if (p.value === undefined) throw new Error(":::counter には value=数 が必要です");
        return {
          type: kind,
          value: num(p.value, "value"),
          start: num(p.from, "from"),
          prefix: p.prefix,
          suffix: p.suffix,
          decimals: num(p.decimals, "decimals"),
          beats: num(p.beats, "beats"),
          label: items(body).join(" ") || undefined,
          ...base,
        };
      case "chart":
        return {
          type: kind,
          kind: p.kind,
          title: p.title,
          unit: p.unit,
          beats: num(p.beats, "beats"),
          items: items(body).map((l) => {
            const m = l.match(/^(.+?)\s*[:：]\s*(-?[\d,.]+)\s*(!)?$/);
            if (!m) throw new Error(`:::chart の行は「- ラベル: 数」です（強調は最後に !）: ${l}`);
            return { label: m[1], value: num(m[2], m[1])!, highlight: !!m[3] };
          }),
          ...base,
        };
      case "history":
        return {
          type: kind,
          every: num(p.every, "every"),
          items: items(body).map((l) => {
            const t = takeTiming(l);
            const m = t.text.match(/^(.+?)\s*[:：]\s*(.+)$/);
            if (!m) throw new Error(`:::history の行は「- 年: 出来事」です: ${l}`);
            return { label: m[1], text: m[2], at: t.at, beat: t.beat };
          }),
          ...base,
        };
      case "hero": {
        const lines = items(body);
        if (!lines.length) throw new Error(":::hero の1行目に題名を書いてください（2行目はサブタイトル）");
        return { type: kind, title: lines[0], subtitle: lines[1], style: p.style, ...base };
      }
      case "backdrop":
        return { type: kind, style: p.style, ...base };
      case "shot":
        if (!p.src) throw new Error(":::shot には src=画像のパス が必要です");
        return { type: kind, src: p.src, frame: p.frame, zoom: num(p.zoom, "zoom"), caption: items(body).join(" ") || undefined, ...base };
      case "three":
        return { type: kind, preset: p.preset, ...base };
      case "terminal":
        return { type: kind, title: p.title, every: num(p.every, "every"), lines: body.filter((l) => l.trim()).map((l) => takeTiming(l.replace(/^\s{0,}/, ""))), ...base };
      case "editor": {
        // 本文はそのまま（字下げも残す）。単独の ::: は部品の終わりになるので、\::: と書く
        const code = body.map((l) => l.replace(/^(\s*)\\:::/, "$1:::")).join("\n").replace(/^\n+|\s+$/g, "");
        return {
          type: kind,
          file: p.file ?? (p.src ? p.src.split("/").pop() : undefined),
          lang: p.lang,
          code,
          src: p.src,
          lines: p.lines,
          typing: p.typing === undefined ? undefined : p.typing !== "false",
          beats: num(p.beats, "beats"),
          ...base,
        };
      }
      case "clip":
        if (!p.src) throw new Error(":::clip には src=動画のパス が必要です");
        return {
          type: kind,
          src: p.src,
          start: num(p.start, "start"),
          end: num(p.end, "end"),
          frame: p.frame,
          caption: items(body).join(" ") || undefined,
          ...base,
        };
      case "features":
        return {
          type: kind,
          every: num(p.every, "every"),
          columns: num(p.columns, "columns"),
          items: items(body).map((l) => {
            const t = takeTiming(l);
            const m = t.text.match(/^(.+?)\s*[:：]\s*(.*)$/);
            return { title: m ? m[1] : t.text, text: m ? m[2] : "", at: t.at, beat: t.beat };
          }),
          ...base,
        };
      case "custom": {
        if (!p.src) throw new Error(":::custom には src=場面のコード（.tsx）が必要です");
        const { src, area: _area, ...props } = p;
        // 本文の「key: value」も props に入れる（長い文字列を渡すとき）
        for (const l of items(body)) {
          const m = l.match(/^(\w+)\s*:\s*(.*)$/);
          if (m) props[m[1]] = m[2];
        }
        return { type: kind, src, props, ...base };
      }
      default:
        throw new Error(
          `未知の部品 :::${kind}（モーション動画で使えるのは kinetic / counter / chart / history / hero / backdrop / shot / three / terminal / editor / clip / features / custom）`,
        );
    }
  })();
  // undefined の値は既定値に任せる
  const clean = Object.fromEntries(Object.entries(el).filter(([, v]) => v !== undefined));
  const r = MotionElement.safeParse(clean);
  if (!r.success) throw new Error(`:::${kind} の指定が不正です: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join(", ")}`);
  return r.data;
}

/** 部品の中で使っている文番号 */
function referencedSentences(el: MotionElement): number[] {
  const own = el.at ? [el.at] : [];
  if (el.type === "kinetic") return [...own, ...el.lines.flatMap((l) => (l.at ? [l.at] : []))];
  if (el.type === "history" || el.type === "features") return [...own, ...el.items.flatMap((l) => (l.at ? [l.at] : []))];
  if (el.type === "terminal") return [...own, ...el.lines.flatMap((l) => (l.at ? [l.at] : []))];
  return own;
}

export function parseMotionScript(source: string): SceneDoc {
  const problems: string[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const { meta, next } = parseFrontMatter(lines);
  // モーション動画の既定：暗いテーマ、場面ごとの効果音は入り方で決まるので全体の効果音はなし
  meta.theme ??= "night";
  meta.se ??= "none";
  // 音楽が主役なので、BGM はナレーションに近い大きさ（ナレーション中は自動で下げる）
  meta.bgmVolume ??= 0.8;
  const speakers = Object.keys((meta.speakers ?? {}) as Record<string, string>);
  let speaker: string | undefined;
  const scenes: Scene[] = [];
  type Cur = { heading: string; line: number; params: Record<string, string>; narration: { text: string; speaker?: string }[]; motion: { el: MotionElement; line: number }[] };
  let cur: Cur | null = null;

  const flush = () => {
    if (!cur) return;
    const c: Cur = cur;
    const groups: { speaker?: string; lines: string[] }[] = [];
    for (const n of c.narration) {
      const g = groups[groups.length - 1];
      if (g && g.speaker === n.speaker) g.lines.push(n.text);
      else groups.push({ speaker: n.speaker, lines: [n.text] });
    }
    const sentences = groups.flatMap((g) =>
      takeSentenceMarkers(splitSentences(g.lines.join("\n"))).map((x) => ({ ...x, ...(g.speaker && { speaker: g.speaker }) })),
    );
    for (const { el, line } of c.motion) {
      for (const n of referencedSentences(el)) {
        if (n > sentences.length) problems.push(`${line}行目: {${n}} を指定していますが、場面「${c.heading}」のナレーションは${sentences.length}文です`);
      }
    }
    let beats: number | undefined;
    try {
      beats = num(c.params.beats, "beats");
    } catch (e) {
      problems.push(`${c.line}行目: ${(e as Error).message}`);
    }
    if (beats === undefined && sentences.length === 0) {
      problems.push(`${c.line}行目: 場面「${c.heading}」に長さがありません（見出しに beats=8 のように拍数を書くか、ナレーションを書いてください）`);
    }
    const transition = Transition.safeParse(c.params.transition ?? "cut");
    if (!transition.success) problems.push(`${c.line}行目: transition= は ${Transition.options.join(" / ")} のどれかです`);
    for (const k of Object.keys(c.params)) {
      if (k !== "beats" && k !== "transition") problems.push(`${c.line}行目: 見出しの ${k}= は使えません（使えるのは beats= と transition=）`);
    }
    scenes.push({
      id: `s${String(scenes.length + 1).padStart(2, "0")}`,
      heading: c.heading,
      showHeading: false,
      sentences,
      elements: [],
      motion: c.motion.map((m) => m.el),
      ...(beats !== undefined && { beats }),
      ...(transition.success && { transition: transition.data }),
    });
  };

  for (let i = next; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      flush();
      // 見出しの後ろの key=value を取り出す
      let heading = h[1].trim();
      const params: Record<string, string> = {};
      for (;;) {
        const m = heading.match(/\s+(\w+)=(\S+)$/);
        if (!m) break;
        params[m[1]] = m[2];
        heading = heading.slice(0, m.index).trim();
      }
      cur = { heading, line: i + 1, params, narration: [], motion: [] };
      continue;
    }
    const block = line.match(/^:::(\w+)\s*(.*?)\s*$/);
    if (block) {
      const start = i + 1;
      const body: string[] = [];
      let args = block[2];
      // 1行で閉じる書き方: :::backdrop style=grid :::
      const selfClosed = /\s*:::$/.test(args);
      if (selfClosed) args = args.replace(/\s*:::$/, "");
      else {
        i++;
        while (i < lines.length && lines[i].trim() !== ":::") body.push(lines[i++]);
        if (i >= lines.length) problems.push(`${start}行目: :::${block[1]} が閉じられていません`);
      }
      if (!cur) {
        problems.push(`${start}行目: ## 見出しより前に部品があります`);
        continue;
      }
      try {
        cur.motion.push({ el: buildMotionElement(block[1], args, body), line: start });
      } catch (e) {
        problems.push(`${start}行目: ${(e as Error).message}`);
      }
      continue;
    }
    if (!cur || !line.trim() || /^\s*<!--.*-->\s*$/.test(line)) continue;
    let text = line.trim();
    if (speakers.length) {
      const said = text.match(/^([^:：\s{]{1,20})\s*[:：]\s*(.+)$/);
      if (said && speakers.includes(said[1])) {
        speaker = said[1];
        text = said[2];
      } else if (!speaker) {
        problems.push(`${i + 1}行目: 文の頭に話者を書いてください（例: ${speakers[0]}: …）`);
        continue;
      }
    }
    cur.narration.push({ text, speaker });
  }
  flush();
  if (!scenes.length) problems.push("場面がありません（## 見出し で場面を始めてください）");
  if (problems.length) throw new ScriptError(problems);
  return SceneDoc.parse({ version: 1, meta: { ...meta, layout: "motion" }, scenes });
}
