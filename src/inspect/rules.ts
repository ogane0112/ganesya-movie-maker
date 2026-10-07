// F6: 自動検査のルール。ブラウザで測った値とタイムラインだけを見る純粋関数。
import { SUBTITLE_MAX_LINES } from "../../remotion/layout";
import type { ResolvedScene, Timeline } from "../schema";

export type Rect = { x: number; y: number; width: number; height: number };

export type Measurement = {
  sceneId: string;
  canvas: { width: number; height: number };
  elements: { kind: string; rect: Rect }[];
  texts: { text: string; fontSize: number; rect: Rect; clipped: boolean }[];
};

export type SubtitleMeasurement = { text: string; lines: number; rect: Rect };

export type Issue = {
  severity: "error" | "warn";
  sceneId: string;
  rule: string;
  message: string;
  hint: string;
};

/** 検査のしきい値。1080p 換算。 */
export const LIMITS = {
  /** 画面端からこれより内側に収める（px） */
  safeMargin: 48,
  minFontPx: 28,
  maxBullets: 6,
  maxCodeLines: 14,
  maxDiagramNodes: 5,
  /** ゲーム実況: 発言が @ の時刻からこれ以上遅れたら知らせる（秒） */
  maxLagSec: 3,
  /** 既定以外の表情が続いてよい文の数 */
  maxFaceSentences: 4,
  /** 1画面に出す文字数の上限（見出しを除く） */
  maxChars: 160,
  /** 部品が画面に出ている時間の下限（秒） */
  minVisibleSec: 1.5,
  minSceneSec: 2.5,
  /** 1文の長さの上限（秒）。長すぎる文は聞き取りにくく、画面も変化しない */
  maxSentenceSec: 12,
  /** ゲーム実況の小ネタ（!note）の文字数の上限。右の欄に収まる量 */
  maxNoteChars: 60,
  /** モーション動画の大きな文字（kinetic）1行の文字数の上限 */
  maxKineticChars: 16,
  /** ネタ動画：大きなテロップ（impact / shout / title）1行の文字数の上限と、出しておく時間の下限（秒） */
  maxCaptionChars: 14,
  minCaptionSec: 0.8,
  /** ネタ動画：1つの台詞の長さの上限（秒）。テンポが落ちる */
  maxSkitSentenceSec: 8,
  /** ネタ動画：スタンプの文字数の上限 */
  maxStampChars: 6,
};

/** 上に部品を重ねてよい背景の部品（data-gmm-el="backdrop"） */
export const BACKDROP = "backdrop";

export function checkLayout(m: Measurement, sceneLabel: string, opts: { safeMargin?: number; texts?: boolean } = {}): Issue[] {
  const margin = opts.safeMargin ?? LIMITS.safeMargin;
  const issues: Issue[] = [];
  const push = (severity: Issue["severity"], rule: string, message: string, hint: string) =>
    issues.push({ severity, sceneId: m.sceneId, rule, message: `${sceneLabel}: ${message}`, hint });

  const safe = { left: margin, top: margin, right: m.canvas.width - margin, bottom: m.canvas.height - margin };
  for (const el of m.elements) {
    // 立ち絵は画面下端に接して置くのが正しいので、安全領域の検査から外す（重なりは検査する）
    // 背景の層（全面の部品）も外す。中の文字は texts で見る
    if (el.kind === "character" || el.kind === BACKDROP) continue;
    const r = el.rect;
    const sides: string[] = [];
    if (r.x < safe.left - 0.5) sides.push(`左 ${Math.round(safe.left - r.x)}px`);
    if (r.y < safe.top - 0.5) sides.push(`上 ${Math.round(safe.top - r.y)}px`);
    if (r.x + r.width > safe.right + 0.5) sides.push(`右 ${Math.round(r.x + r.width - safe.right)}px`);
    if (r.y + r.height > safe.bottom + 0.5) sides.push(`下 ${Math.round(r.y + r.height - safe.bottom)}px`);
    if (sides.length) {
      push(
        "error",
        "overflow",
        `${el.kind} が画面の安全領域からはみ出しています（${sides.join("、")}）`,
        "内容を減らすか、シーンを2つに分けてください",
      );
    }
  }

  // 背景（全面のゲーム画面など、上に重ねる前提のもの）は重なりの検査から外す
  const fg = m.elements.filter((e) => e.kind !== BACKDROP);
  for (let i = 0; i < fg.length; i++) {
    for (let j = i + 1; j < fg.length; j++) {
      const a = fg[i].rect;
      const b = fg[j].rect;
      const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (w > 1 && h > 1) {
        push(
          "error",
          "overlap",
          `${fg[i].kind} と ${fg[j].kind} が重なっています（${Math.round(w)}×${Math.round(h)}px）`,
          "部品の数を減らすか、シーンを分けてください",
        );
      }
    }
  }

  for (const t of m.texts) {
    // モーション動画：部品は全面の層なので、文字そのものが安全領域に収まっているかを見る
    if (opts.texts) {
      const r = t.rect;
      const out = r.x < safe.left - 0.5 || r.y < safe.top - 0.5 || r.x + r.width > safe.right + 0.5 || r.y + r.height > safe.bottom + 0.5;
      // 見えていない文字（画面の外に送った年表の項目など）は数えない
      const visible = r.x + r.width > 0 && r.x < m.canvas.width && r.y + r.height > 0 && r.y < m.canvas.height;
      if (out && visible && r.width > 0) {
        push("error", "overflow", `文字「${t.text.slice(0, 16)}」が画面の端からはみ出しています`, "文字を短くするか、size= で小さくしてください");
      }
    }
    if (t.clipped) {
      push("error", "clipped", `「${t.text}」が枠から横にはみ出しています`, "文字を短くするか、改行してください（図解なら箱を減らすか direction=TB に）");
    }
    if (t.fontSize < LIMITS.minFontPx) {
      push("warn", "font-size", `「${t.text}」の文字が小さすぎます（${t.fontSize}px < ${LIMITS.minFontPx}px）`, "文字を大きくできるよう内容を減らしてください");
    }
  }
  return issues;
}

/** 字幕は2行まで。部品（立ち絵を含む）と重なってはいけない */
export function checkSubtitle(sub: SubtitleMeasurement, elements: Measurement["elements"], sceneId: string, label: string): Issue[] {
  const issues: Issue[] = [];
  const short = sub.text.length > 20 ? `${sub.text.slice(0, 20)}…` : sub.text;
  if (sub.lines > SUBTITLE_MAX_LINES) {
    issues.push({
      severity: "warn",
      sceneId,
      rule: "subtitle-lines",
      message: `${label}: 字幕が${sub.lines}行になります「${short}」`,
      hint: "文を短く分けてください（字幕は2行まで）",
    });
  }
  for (const el of elements) {
    if (el.kind !== BACKDROP && intersects(el.rect, sub.rect)) {
      issues.push({
        severity: "error",
        sceneId,
        rule: "overlap",
        message: `${label}: ${el.kind} が字幕と重なっています「${short}」`,
        hint: "部品の数や行数を減らすか、シーンを分けてください",
      });
    }
  }
  return issues;
}

function intersects(a: Rect, b: Rect): boolean {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
}

export function checkScene(scene: ResolvedScene, timeline: Timeline): Issue[] {
  const { fps } = timeline.meta;
  const issues: Issue[] = [];
  const label = `${scene.id}「${scene.heading}」`;
  const push = (severity: Issue["severity"], rule: string, message: string, hint: string) =>
    issues.push({ severity, sceneId: scene.id, rule, message: `${label}: ${message}`, hint });
  const visibleSec = (from: number) => (scene.durationInFrames - from) / fps;

  if (scene.durationInFrames / fps < LIMITS.minSceneSec) {
    push("warn", "short-scene", `シーンが短すぎます（${(scene.durationInFrames / fps).toFixed(1)}秒）`, "ナレーションを足すか、前後のシーンとまとめてください");
  }
  scene.sentences.forEach((s, i) => {
    if (s.durationInFrames / fps > LIMITS.maxSentenceSec) {
      push("warn", "long-sentence", `${i + 1}文目が長すぎます（${(s.durationInFrames / fps).toFixed(1)}秒）「${s.text.slice(0, 20)}…」`, "文を2つに分けてください");
    }
  });

  let chars = 0;
  for (const el of scene.elements) {
    const starts: { label: string; from: number }[] = [];
    if (el.type === "bullets") {
      if (el.items.length > LIMITS.maxBullets) {
        push("warn", "density", `箇条書きが${el.items.length}項目あります（上限 ${LIMITS.maxBullets}）`, "項目を絞るか、シーンを分けてください");
      }
      el.items.forEach((it) => {
        chars += [...it.text].length;
        starts.push({ label: `箇条書き「${it.text.slice(0, 15)}」`, from: it.from });
      });
    } else if (el.type === "code") {
      if (el.lines.length > LIMITS.maxCodeLines) {
        push("warn", "density", `コードが${el.lines.length}行あります（上限 ${LIMITS.maxCodeLines}）`, "要点の行だけに絞ってください");
      }
      starts.push({ label: "コード", from: el.from });
      el.highlights.forEach((h) => starts.push({ label: `コードのハイライト（${h.lines.join(",")}行目）`, from: h.from }));
    } else if (el.type === "diagram") {
      if (el.nodes.length > LIMITS.maxDiagramNodes) {
        push("warn", "density", `図解の箱が${el.nodes.length}個あります（上限 ${LIMITS.maxDiagramNodes}）`, "箱をまとめるか、図を2つに分けてください");
      }
      el.nodes.forEach((n) => {
        chars += [...n.text].length;
        starts.push({ label: `図の箱「${n.text.slice(0, 15)}」`, from: n.from });
      });
      el.edges.forEach((e) => e && starts.push({ label: `図の矢印${e.label ? `「${e.label}」` : ""}`, from: e.from }));
    } else if (el.type === "term") {
      chars += [...el.term].length + [...el.description].length;
      starts.push({ label: `用語カード「${el.term}」`, from: el.from });
    } else if (el.type === "math") {
      starts.push({ label: "数式", from: el.from });
    } else if (el.type === "image") {
      chars += [...(el.caption ?? "")].length;
      starts.push({ label: "画像", from: el.from });
    } else if (el.type === "title") {
      chars += [...el.title].length + [...(el.subtitle ?? "")].length;
      starts.push({ label: "タイトル", from: el.from });
    } else {
      chars += [...el.text].length;
      starts.push({ label: "テキスト", from: el.from });
    }
    for (const s of starts) {
      if (visibleSec(s.from) < LIMITS.minVisibleSec) {
        push("warn", "short-visible", `${s.label} が表示されるのが${visibleSec(s.from).toFixed(1)}秒だけです`, "{n} の番号を前の文にするか、後ろにナレーションを足してください");
      }
    }
  }
  if (chars > LIMITS.maxChars) {
    push("warn", "density", `1画面の文字数が多すぎます（${chars}字 > ${LIMITS.maxChars}字）`, "画面にはキーワードだけを出し、説明はナレーションに回してください");
  }
  if (scene.elements.length === 0) {
    push("warn", "empty", "見出し以外に画面に出すものがありません", ":::bullets などで要点を出してください");
  }
  return issues;
}

/** ゲーム実況（biim）のシーンの検査：実況の遅れ・録画の終わり超え・長すぎる文 */
export function checkBiimScene(scene: ResolvedScene, timeline: Timeline, isLast: boolean): Issue[] {
  const { fps } = timeline.meta;
  const issues: Issue[] = [];
  const label = `${scene.id}「${scene.heading}」`;
  for (const s of scene.sentences) {
    if (s.carry) continue;
    const short = s.text.length > 18 ? `${s.text.slice(0, 18)}…` : s.text;
    if (s.anchor !== undefined && (s.from - s.anchor) / fps > LIMITS.maxLagSec) {
      issues.push({
        severity: "warn",
        sceneId: scene.id,
        rule: "lag",
        message: `${label}: 「${short}」が、指定した時刻より${((s.from - s.anchor) / fps).toFixed(1)}秒遅れて始まります`,
        hint: "前の発言を短くするか減らす、または @ の時刻を後ろにずらしてください（映像と話がずれます）",
      });
    }
    if (s.durationInFrames / fps > LIMITS.maxSentenceSec) {
      issues.push({ severity: "warn", sceneId: scene.id, rule: "long-sentence", message: `${label}: 「${short}」が長すぎます（${(s.durationInFrames / fps).toFixed(1)}秒）`, hint: "文を2つに分けてください" });
    }
    if (isLast && s.from + s.durationInFrames > scene.durationInFrames) {
      issues.push({
        severity: "error",
        sceneId: scene.id,
        rule: "past-end",
        message: `${label}: 「${short}」が録画の終わりを越えます`,
        hint: "終わりの発言を減らすか短くしてください",
      });
    }
  }
  for (const n of scene.notes ?? []) {
    if (n.from > 0 && [...n.text].length > LIMITS.maxNoteChars) {
      issues.push({
        severity: "warn",
        sceneId: scene.id,
        rule: "note-long",
        message: `${label}: 小ネタ「${n.text.slice(0, 18)}…」が長すぎます（${[...n.text].length}文字 > ${LIMITS.maxNoteChars}文字）`,
        hint: "要点だけに縮めるか、!note を2つに分けてください（右の欄に収まりません）",
      });
    }
  }
  return issues;
}

/**
 * モーション動画：別々の文字が重なっていないか（部品は層なので、上下に重ねた文字がぶつかることがある）。
 * 片方がもう片方を含む（入れ子の）ときは数えない
 */
export function checkTextOverlap(texts: Measurement["texts"], sceneId: string, label: string): Issue[] {
  const issues: Issue[] = [];
  const area = (r: { width: number; height: number }) => r.width * r.height;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i].rect;
      const b = texts[j].rect;
      if (!area(a) || !area(b)) continue;
      const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (w <= 0 || h <= 0) continue;
      const inside = w * h >= Math.min(area(a), area(b)) - 1;
      if (inside) continue;
      // 小さいほうの 15% 以上が重なっていたら知らせる
      if ((w * h) / Math.min(area(a), area(b)) > 0.15) {
        issues.push({
          severity: "warn",
          sceneId,
          rule: "text-overlap",
          message: `${label}: 文字「${texts[i].text.slice(0, 12)}」と「${texts[j].text.slice(0, 12)}」が重なっています`,
          hint: "area= で置き場所を分けるか、出す拍をずらすか、場面を分けてください",
        });
      }
    }
  }
  return issues;
}

/** モーション動画の場面の検査（画面を測らずにわかるもの） */
export function checkMotionScene(scene: ResolvedScene, timeline: Timeline): Issue[] {
  const { fps } = timeline.meta;
  const fpb = timeline.motion!.framesPerBeat;
  const label = `${scene.id}「${scene.heading}」`;
  const issues: Issue[] = [];
  const last = scene.sentences.at(-1);
  if (last && last.from + last.durationInFrames > scene.durationInFrames) {
    const need = Math.ceil((last.from + last.durationInFrames + fps * 0.5) / fpb);
    issues.push({
      severity: "error",
      sceneId: scene.id,
      rule: "motion-narration-long",
      message: `${label}: ナレーションが場面の長さ（${Math.round(scene.durationInFrames / fpb)}拍）に収まりません`,
      hint: `beats= を ${need} 以上にするか、省略してナレーションに合わせてください（または文を減らす）`,
    });
  }
  for (const s of scene.sentences) {
    if (s.durationInFrames / fps > LIMITS.maxSentenceSec) {
      issues.push({ severity: "warn", sceneId: scene.id, rule: "long-sentence", message: `${label}: 「${s.text.slice(0, 18)}…」が長すぎます`, hint: "文を2つに分けてください" });
    }
  }
  for (const el of scene.motion ?? []) {
    if (el.type !== "kinetic") continue;
    for (const l of el.lines) {
      const n = [...l.text.replace(/\*\*/g, "")].length;
      if (n > LIMITS.maxKineticChars) {
        issues.push({
          severity: "warn",
          sceneId: scene.id,
          rule: "kinetic-long",
          message: `${label}: 大きな文字「${l.text.slice(0, 12)}…」が長すぎます（${n}文字）`,
          hint: `1行は${LIMITS.maxKineticChars}文字までにして、行を分けてください（大きな文字は一目で読める量に）`,
        });
      }
    }
    // 1行を出しておく時間が短すぎないか
    el.lines.forEach((l, i) => {
      const next = el.lines[i + 1]?.from ?? scene.durationInFrames;
      if (el.mode === "replace" && next - l.from < fps * 0.4) {
        issues.push({
          severity: "warn",
          sceneId: scene.id,
          rule: "kinetic-fast",
          message: `${label}: 大きな文字「${l.text.slice(0, 12)}」が${((next - l.from) / fps).toFixed(2)}秒で入れ替わります`,
          hint: "every= を大きくするか、bpm を下げてください（0.4 秒以上見せる）",
        });
      }
    });
  }
  return issues;
}

/** ネタ動画の場面の検査（画面を測らずにわかるもの）：台詞・テロップ・スタンプの長さ */
export function checkSkitScene(scene: ResolvedScene, timeline: Timeline): Issue[] {
  const { fps } = timeline.meta;
  const label = `${scene.id}「${scene.heading}」`;
  const issues: Issue[] = [];
  const push = (severity: Issue["severity"], rule: string, message: string, hint: string) =>
    issues.push({ severity, sceneId: scene.id, rule, message: `${label}: ${message}`, hint });
  for (const s of scene.sentences) {
    if (s.durationInFrames / fps > LIMITS.maxSkitSentenceSec) {
      push("warn", "long-sentence", `「${s.text.slice(0, 18)}…」が長すぎます（${(s.durationInFrames / fps).toFixed(1)}秒）`, "台詞を2つに分けるか、相手の相づちを挟んでください（ネタ動画はテンポが命）");
    }
  }
  const sk = scene.skit;
  if (!sk) return issues;
  for (const c of sk.captions) {
    const longest = Math.max(...c.text.split("\\n").map((l) => [...l].length));
    if (["impact", "shout", "title"].includes(c.style) && longest > LIMITS.maxCaptionChars) {
      push("warn", "caption-long", `テロップ「${c.text.slice(0, 12)}…」が長すぎます（${longest}文字）`, `大きなテロップは1行${LIMITS.maxCaptionChars}文字まで。\\n で改行するか、短い言葉にしてください`);
    }
    if ((c.to - c.from) / fps < LIMITS.minCaptionSec) {
      push("warn", "short-visible", `テロップ「${c.text.slice(0, 12)}」が${((c.to - c.from) / fps).toFixed(1)}秒で消えます`, "次のテロップを1つ後の台詞にずらすか、!wait で間を置いてください");
    }
  }
  for (const st of sk.stamps) {
    if ([...st.text].length > LIMITS.maxStampChars) {
      push("warn", "stamp-long", `スタンプ「${st.text}」が長すぎます`, `スタンプは${LIMITS.maxStampChars}文字まで（長い言葉は !caption で）`);
    }
  }
  return issues;
}

/** 既定以外の表情（驚き・困りなど）が長く続きすぎていないか。表情は次の指定まで続くので、戻し忘れを見つける（掛け合いでは話者ごと） */
export function checkFaces(t: Timeline): Issue[] {
  const who = t.cast?.length
    ? t.cast.filter((m) => m.character).map((m) => ({ name: m.name as string | undefined, ch: m.character! }))
    : t.character
      ? [{ name: undefined, ch: t.character }]
      : [];
  const issues: Issue[] = [];
  for (const { name, ch } of who) {
    let run: { face: string; count: number; sceneId: string; label: string } | undefined;
    const flush = () => {
      if (run && run.face !== ch.defaultFace && run.count > LIMITS.maxFaceSentences) {
        issues.push({
          severity: "warn",
          sceneId: run.sceneId,
          rule: "face-long",
          message: `${run.label}: ${name ? `${name}の` : ""}表情「${run.face}」が${run.count}文続いています`,
          hint: `表情は次の指定まで続きます。話の区切りで {face:${ch.defaultFace}} に戻してください`,
        });
      }
    };
    for (const scene of t.scenes) {
      for (const s of scene.sentences) {
        if (name && s.speaker !== name) continue;
        const face = s.face ?? ch.defaultFace;
        if (run?.face === face) run.count++;
        else {
          flush();
          run = { face, count: 1, sceneId: scene.id, label: `${scene.id}「${scene.heading}」から` };
        }
      }
    }
    flush();
  }
  return issues;
}

type Pos = { scene: number; sentence: number };
const before = (a: Pos, b: Pos) => a.scene < b.scene || (a.scene === b.scene && a.sentence < b.sentence);

/** 画面に出る文字（コードと数式は除く）。用語が使われているかを調べるのに使う */
function screenText(el: ResolvedScene["elements"][number]): string[] {
  switch (el.type) {
    case "title":
      return [el.title, el.subtitle ?? ""];
    case "bullets":
      return el.items.map((i) => i.text);
    case "text":
      return [el.text];
    case "diagram":
      return [...el.nodes.map((n) => n.text), ...el.edges.map((e) => e?.label ?? "")];
    case "image":
      return [el.caption ?? ""];
    default:
      return [];
  }
}

/**
 * 専門用語（glossary）が、動画のどこかで説明されているか。
 * 説明 = {term:用語} の付いた文か、用語カード。一度も説明していなければエラー。
 * 説明より前のシーンで使っていたら警告（同じシーン内なら直後の説明でよい）。
 * タイトルのシーン（:::title のあるシーン。表紙・エンディング）は、題名として用語を出すのが普通なので数えない。
 */
export function checkTerms(t: Timeline): Issue[] {
  const issues: Issue[] = [];
  const label = (p: Pos) => `${t.scenes[p.scene].id}「${t.scenes[p.scene].heading}」`;
  for (const term of Object.keys(t.meta.glossary ?? {})) {
    let firstUse: Pos | undefined;
    let explained: Pos | undefined;
    t.scenes.forEach((scene, si) => {
      if (scene.elements.some((el) => el.type === "title")) return;
      // 画面の文字は、出る文の位置で使われたとみなす
      const shown = scene.elements.flatMap((el) => {
        const from = "from" in el ? el.from : 0;
        const idx = Math.max(0, scene.sentences.findLastIndex((s) => s.from <= from));
        return screenText(el).filter((x) => x.includes(term)).map(() => idx);
      });
      // 見出しはシーンの最初から出ている
      if (scene.showHeading && scene.heading.includes(term)) shown.push(0);
      scene.sentences.forEach((s, j) => {
        const pos = { scene: si, sentence: j };
        if ((s.text.includes(term) || shown.includes(j)) && (!firstUse || before(pos, firstUse))) firstUse = pos;
        if (s.explains?.includes(term) && !explained) explained = pos;
      });
    });
    const id = (p: Pos | undefined) => (p ? t.scenes[p.scene].id : t.scenes[0]?.id ?? "");
    if (!explained) {
      issues.push({
        severity: firstUse ? "error" : "warn",
        sceneId: id(firstUse),
        rule: "term-unexplained",
        message: firstUse
          ? `専門用語「${term}」が${label(firstUse)}から使われていますが、説明している文がありません`
          : `glossary の用語「${term}」が動画の中で使われていません`,
        hint: firstUse
          ? `最初に使う所で説明する文を足し、文頭に {term:${term}} を付けてください（:::term ${term} の用語カードでもよい）`
          : "使わないなら glossary: から外してください",
      });
    } else if (firstUse && firstUse.scene < explained.scene) {
      issues.push({
        severity: "warn",
        sceneId: t.scenes[firstUse.scene].id,
        rule: "term-before-explained",
        message: `専門用語「${term}」が${label(firstUse)}で使われていますが、説明は後の${label(explained)}です`,
        hint: "説明を最初に使うシーンへ移すか、最初に使うシーンで一言説明してください",
      });
    }
  }
  return issues;
}

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return "検査OK: 問題は見つかりませんでした";
  const errors = issues.filter((i) => i.severity === "error").length;
  const lines = issues.map((i) => `[${i.severity === "error" ? "ERROR" : "WARN "}] ${i.rule}: ${i.message}\n        → ${i.hint}`);
  lines.push(`\nエラー ${errors}件 / 警告 ${issues.length - errors}件`);
  return lines.join("\n");
}
