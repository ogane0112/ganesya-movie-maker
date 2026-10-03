// F6: 自動検査のルール。ブラウザで測った値とタイムラインだけを見る純粋関数。
import type { ResolvedScene, Timeline } from "../schema";

export type Rect = { x: number; y: number; width: number; height: number };

export type Measurement = {
  sceneId: string;
  canvas: { width: number; height: number };
  elements: { kind: string; rect: Rect }[];
  texts: { text: string; fontSize: number; rect: Rect; clipped: boolean }[];
};

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
  /** 1画面に出す文字数の上限（見出しを除く） */
  maxChars: 160,
  /** 部品が画面に出ている時間の下限（秒） */
  minVisibleSec: 1.5,
  minSceneSec: 2.5,
  /** 1文の長さの上限（秒）。長すぎる文は聞き取りにくく、画面も変化しない */
  maxSentenceSec: 12,
};

export function checkLayout(m: Measurement, sceneLabel: string): Issue[] {
  const issues: Issue[] = [];
  const push = (severity: Issue["severity"], rule: string, message: string, hint: string) =>
    issues.push({ severity, sceneId: m.sceneId, rule, message: `${sceneLabel}: ${message}`, hint });

  const safe = {
    left: LIMITS.safeMargin,
    top: LIMITS.safeMargin,
    right: m.canvas.width - LIMITS.safeMargin,
    bottom: m.canvas.height - LIMITS.safeMargin,
  };
  for (const el of m.elements) {
    // 立ち絵は画面下端に接して置くのが正しいので、安全領域の検査から外す（重なりは検査する）
    if (el.kind === "character") continue;
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

  for (let i = 0; i < m.elements.length; i++) {
    for (let j = i + 1; j < m.elements.length; j++) {
      const a = m.elements[i].rect;
      const b = m.elements[j].rect;
      const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (w > 1 && h > 1) {
        push(
          "error",
          "overlap",
          `${m.elements[i].kind} と ${m.elements[j].kind} が重なっています（${Math.round(w)}×${Math.round(h)}px）`,
          "部品の数を減らすか、シーンを分けてください",
        );
      }
    }
  }

  for (const t of m.texts) {
    if (t.clipped) {
      push("error", "clipped", `「${t.text}」が横にはみ出して切れています`, "行を短くするか、改行してください");
    }
    if (t.fontSize < LIMITS.minFontPx) {
      push("warn", "font-size", `「${t.text}」の文字が小さすぎます（${t.fontSize}px < ${LIMITS.minFontPx}px）`, "文字を大きくできるよう内容を減らしてください");
    }
  }
  return issues;
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

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return "検査OK: 問題は見つかりませんでした";
  const errors = issues.filter((i) => i.severity === "error").length;
  const lines = issues.map((i) => `[${i.severity === "error" ? "ERROR" : "WARN "}] ${i.rule}: ${i.message}\n        → ${i.hint}`);
  lines.push(`\nエラー ${errors}件 / 警告 ${issues.length - errors}件`);
  return lines.join("\n");
}
