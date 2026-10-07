// ネタ動画・ショート・ゆっくり・寸劇（layout: skit）の台本パーサ。
//
//   ---                            フロントマター（layout: skit / format: short / style: yukkuri / speakers / characters …）
//   ## 見出し bg=sunburst transition=flash   場面。bg: 背景（#色・模様・画像・動画）、transition: 入り方
//   れいむ: {face:smile}{act:jump}台詞     台詞。文頭の {act:動き} {fx:画面効果} {se:効果音} はその台詞の頭で起きる
//   !caption 衝撃の事実 style=impact     指示の行。次の台詞が始まるときに起きる（場面の最後なら最後の台詞の後）
//   !wait 1.5                          次の台詞の前に間を置く（秒）
//
// 指示の一覧は docs/skit.md。
import { parseFrontMatter, ScriptError, splitSentences, takeSentenceMarkers } from "../parse.js";
import { SceneDoc, type Scene } from "../schema.js";
import { ACTS, CAPTION_STYLES, Cue, FXS, SkitTransition, type StagePos } from "./schema.js";

/** 指示の行で使える命令 */
export const DIRECTIVES = ["caption", "stamp", "pic", "enter", "exit", "move", "act", "face", "fx", "se", "wait"] as const;

/** 1行の引数を、位置で渡す語と key=value に分ける（"…" で空白を含められる） */
function splitArgs(src: string): { words: string[]; params: Record<string, string> } {
  const words: string[] = [];
  const params: Record<string, string> = {};
  const re = /(\w+)=("([^"]*)"|\S+)|"([^"]*)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1]) params[m[1]] = m[3] ?? m[2];
    else words.push(m[4] ?? m[5]);
  }
  return { words, params };
}

const stagePos = (v: string | undefined): StagePos | undefined => {
  if (v === undefined) return undefined;
  if (v === "left" || v === "center" || v === "right") return v;
  const n = Number(v.replace(/%$/, ""));
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error(`立ち位置は left / center / right か 0〜100 の数です: ${v}`);
  return n;
};

/**
 * 指示の行（! を除いたもの）を読む。wait は数（秒）を返す。
 * cast: 舞台に立てる人（speakers: の名前）
 */
export function parseDirective(line: string, cast: string[]): Cue | { kind: "wait"; seconds: number } {
  const m = line.match(/^(\w+)\s*(.*)$/);
  if (!m) throw new Error(`指示の書き方が不正です: !${line}`);
  const [, cmd, rest] = m;
  const { words, params } = splitArgs(rest);
  const who = (name: string | undefined) => {
    if (!name) throw new Error(`!${cmd} の後ろに名前を書いてください（${cast.join("、") || "speakers: に話者を書いてください"}）`);
    if (!cast.includes(name)) throw new Error(`!${cmd} の「${name}」は話者にいません（使えるのは ${cast.join("、")}）`);
    return name;
  };
  let cue: unknown;
  switch (cmd) {
    case "caption": {
      // 本文は key=value 以外の全部（空なら消す）
      const text = rest.replace(/\s*\b(style|pos)=("[^"]*"|\S+)/g, "").trim();
      cue = { kind: "caption", text, style: params.style, pos: params.pos };
      break;
    }
    case "stamp":
      if (!words.length) throw new Error("!stamp の後ろに文字を書いてください（例: !stamp ！？）");
      cue = { kind: "stamp", text: words.join(" "), pos: params.pos };
      break;
    case "pic":
      cue = {
        kind: "pic",
        src: params.src ?? words[0],
        pos: params.pos,
        size: params.size === undefined ? undefined : Number(params.size),
        anim: params.in ?? params.anim,
      };
      break;
    case "enter":
      cue = { kind: "enter", who: who(words[0]), pos: stagePos(params.pos ?? words[1]) };
      break;
    case "exit":
      cue = { kind: "exit", who: who(words[0]) };
      break;
    case "move": {
      const pos = stagePos(params.pos ?? words[1]);
      if (pos === undefined) throw new Error("!move には行き先を書いてください（例: !move まりさ center）");
      cue = { kind: "move", who: who(words[0]), pos };
      break;
    }
    case "act":
      // !act jump（次の台詞の話者）/ !act まりさ jump
      cue = words.length >= 2 ? { kind: "act", who: who(words[0]), act: words[1] } : { kind: "act", act: words[0] };
      break;
    case "face":
      if (words.length < 2) throw new Error("!face には名前と表情を書いてください（例: !face まりさ surprised）");
      cue = { kind: "face", who: who(words[0]), face: words[1] };
      break;
    case "fx":
      cue = { kind: "fx", fx: words[0] };
      break;
    case "se":
      if (!words[0]) throw new Error("!se の後ろに効果音の名前かファイルを書いてください（gmm se list で一覧）");
      cue = { kind: "se", se: words[0] };
      break;
    case "wait": {
      const seconds = Number(words[0]);
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 10) throw new Error("!wait の後ろに間の秒数（0〜10）を書いてください（例: !wait 1.5）");
      return { kind: "wait", seconds };
    }
    default:
      throw new Error(`未知の指示 !${cmd}（使えるのは ${DIRECTIVES.map((d) => "!" + d).join(" ")}）`);
  }
  const clean = Object.fromEntries(Object.entries(cue as object).filter(([, v]) => v !== undefined));
  const r = Cue.safeParse(clean);
  if (!r.success) throw new Error(`!${cmd} の指定が不正です: ${describe(r.error.issues)}`);
  return r.data;
}

function describe(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((i) => {
      const k = String(i.path[0] ?? "");
      if (k === "act") return `動きは ${ACTS.join(" / ")}`;
      if (k === "fx") return `画面効果は ${FXS.join(" / ")}`;
      if (k === "style") return `テロップの style= は ${CAPTION_STYLES.join(" / ")}`;
      return `${i.path.join(".")} ${i.message}`;
    })
    .join(", ");
}

/** 文頭の {act:動き} {fx:画面効果} {se:効果音} を指示にする（{act:まりさ:shake} で話者以外も動かせる） */
function markToCue(kind: string, value: string, cast: string[]): Cue {
  if (kind === "act") {
    const [a, b] = value.split(/[:：]/);
    return parseDirective(b ? `act ${a} ${b}` : `act ${a}`, cast) as Cue;
  }
  return parseDirective(`${kind} ${value}`, cast) as Cue;
}

export function parseSkitScript(source: string): SceneDoc {
  const problems: string[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const { meta, next } = parseFrontMatter(lines);
  // 場面転換のチャイムは鳴らさない（効果音は !se で入れる）
  meta.se ??= "none";
  meta.style ??= "meme";
  meta.theme ??= "pop";
  // 画面の形
  const format = String(meta.format ?? "wide");
  if (format === "short") (meta.width = 1080), (meta.height = 1920);
  else if (format === "square") (meta.width = 1080), (meta.height = 1080);
  // 掛け合いでない（speakers: がない）ときは、character: の1人がナレーターとして立つ
  let speakersMap = (meta.speakers ?? {}) as Record<string, string>;
  if (!Object.keys(speakersMap).length && meta.character && meta.character !== "none") {
    const name = String(meta.narrator ?? "ナレーター");
    speakersMap = { [name]: String(meta.voice ?? "zundamon") };
    meta.speakers = speakersMap;
    meta.characters = { [name]: String(meta.character) };
    delete meta.character;
  }
  delete meta.narrator;
  const speakers = Object.keys(speakersMap);
  // 話者が1人なら「名前:」は省略できる
  let speaker: string | undefined = speakers.length === 1 ? speakers[0] : undefined;

  type Line = { text: string; speaker?: string; cues: Cue[]; wait: number; line: number };
  type Cur = { heading: string; line: number; params: Record<string, string>; lines: Line[]; pending: Cue[]; wait: number };
  const scenes: Scene[] = [];
  let cur: Cur | null = null;

  const flush = () => {
    if (!cur) return;
    const c: Cur = cur;
    // 台詞の行を、同じ話者の続く行ごとに文に分ける。指示は、その行の最初の文に付ける
    const sentences: Scene["sentences"] = [];
    for (const l of c.lines) {
      const parts = takeSentenceMarkers(splitSentences(l.text), ["act", "fx", "se"]);
      parts.forEach((p, k) => {
        const cues: Cue[] = k === 0 ? [...l.cues] : [];
        for (const mk of p.marks ?? []) {
          try {
            cues.push(markToCue(mk.kind, mk.value, speakers));
          } catch (e) {
            problems.push(`${l.line}行目: ${(e as Error).message}`);
          }
        }
        sentences.push({
          text: p.text,
          ...(p.speech && { speech: p.speech }),
          ...(p.face && { face: p.face }),
          ...(p.explains && { explains: p.explains }),
          ...(l.speaker && { speaker: l.speaker }),
          ...(cues.length && { cues }),
          ...(k === 0 && l.wait > 0 && { wait: l.wait }),
        });
      });
    }
    if (!sentences.length && !c.pending.length) {
      problems.push(`${c.line}行目: 場面「${c.heading}」に台詞も指示もありません`);
    }
    const transition = SkitTransition.safeParse(c.params.transition ?? "cut");
    if (!transition.success) problems.push(`${c.line}行目: transition= は ${SkitTransition.options.join(" / ")} のどれかです`);
    for (const k of Object.keys(c.params)) {
      if (k !== "bg" && k !== "transition") problems.push(`${c.line}行目: 見出しの ${k}= は使えません（使えるのは bg= と transition=）`);
    }
    scenes.push({
      id: `s${String(scenes.length + 1).padStart(2, "0")}`,
      heading: c.heading,
      showHeading: false,
      sentences,
      elements: [],
      skit: {
        ...(c.params.bg && { bg: c.params.bg }),
        transition: transition.success ? transition.data : "cut",
        tail: c.pending,
        ...(c.wait > 0 && { tailWait: c.wait }),
      },
    });
  };

  for (let i = next; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      flush();
      let heading = h[1].trim();
      const params: Record<string, string> = {};
      for (;;) {
        const m = heading.match(/\s+(\w+)=("[^"]*"|\S+)$/);
        if (!m) break;
        params[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
        heading = heading.slice(0, m.index).trim();
      }
      cur = { heading, line: i + 1, params, lines: [], pending: [], wait: 0 };
      continue;
    }
    if (!line.trim() || /^\s*<!--.*-->\s*$/.test(line)) continue;
    if (!cur) {
      if (/^\s*!\w/.test(line) || line.trim().startsWith(":::")) problems.push(`${i + 1}行目: ## 見出しより前に指示があります`);
      continue;
    }
    const directive = line.match(/^\s*!(\w.*)$/);
    if (directive) {
      try {
        const d = parseDirective(directive[1].replace(/\s+#\s.*$/, "").trim(), speakers);
        if (d.kind === "wait") cur.wait += d.seconds;
        else cur.pending.push(d);
      } catch (e) {
        problems.push(`${i + 1}行目: ${(e as Error).message}`);
      }
      continue;
    }
    if (line.trim().startsWith(":::")) {
      problems.push(`${i + 1}行目: ネタ動画（layout: skit）では ::: の部品は使えません。!caption や !pic を使ってください`);
      continue;
    }
    let text = line.trim();
    if (speakers.length) {
      const said = text.match(/^([^:：\s{]{1,20})\s*[:：]\s*(.+)$/);
      if (said && speakers.includes(said[1])) {
        speaker = said[1];
        text = said[2];
      } else if (!speaker) {
        problems.push(`${i + 1}行目: 台詞の頭に話者を書いてください（例: ${speakers[0]}: …）。使える話者: ${speakers.join("、")}`);
        continue;
      }
    }
    cur.lines.push({ text, speaker, cues: cur.pending, wait: cur.wait, line: i + 1 });
    cur.pending = [];
    cur.wait = 0;
  }
  flush();
  if (!scenes.length) problems.push("場面がありません（## 見出し で場面を始めてください）");
  if (problems.length) throw new ScriptError(problems);
  return SceneDoc.parse({ version: 1, meta: { ...meta, layout: "skit" }, scenes });
}
