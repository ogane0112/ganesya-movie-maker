// モーション動画の「使っている様子」を見せる部品：ターミナル・エディタ・動画の再生・できることの一覧。
// どれも置き場所（area）の枠いっぱいに描く。frame は場面の頭からのフレーム。
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { ease, pop, type Palette } from "./kit";
import type { PartProps } from "./parts";

const MONO = '"JetBrains Mono", "M PLUS 1", "Noto Sans JP", monospace';

/** 窓（タイトルバーつき）。出るときに下から浮き上がる */
const Window: React.FC<{
  title: string;
  frame: number;
  from: number;
  fpb: number;
  palette: Palette;
  children: React.ReactNode;
  dark?: boolean;
  /** 窓の高さ（中身に合わせる）。枠の高さより大きければ枠いっぱい。上下の真ん中に置く */
  contentHeight?: number;
  boxHeight?: number;
}> = ({ title, frame, from, fpb, palette, children, dark, contentHeight, boxHeight }) => {
  const a = ease(frame - from, fpb * 0.6);
  const h = contentHeight && boxHeight ? Math.min(boxHeight, contentHeight + 52) : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: h ? (boxHeight! - h) / 2 : 0,
        height: h ?? "100%",
        borderRadius: 18,
        overflow: "hidden",
        background: dark ? "#070a12" : palette.surface,
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: `0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px ${palette.accent}22`,
        transform: `translateY(${(1 - a) * 60}px) scale(${0.97 + 0.03 * a})`,
        opacity: a,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 52, flex: "none", display: "flex", alignItems: "center", padding: "0 20px", background: "rgba(255,255,255,0.04)", position: "relative" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, marginRight: 9 }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 22, color: palette.subtext, fontFamily: MONO }}>{title}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
    </div>
  );
};

/** 点滅するカーソル（決まった周期） */
const Caret: React.FC<{ frame: number; color: string }> = ({ frame, color }) => (
  <span style={{ display: "inline-block", width: "0.6em", height: "1.1em", verticalAlign: "-0.15em", background: color, opacity: Math.floor(frame / 15) % 2 ? 0 : 1, marginLeft: 2 }} />
);

// ---- terminal ----

export const Terminal: React.FC<PartProps<"terminal">> = ({ el, frame, fpb, height, palette }) => {
  if (frame < el.from) return null;
  const shown = el.lines.filter((l) => l.from <= frame);
  const fontSize = 30;
  const lineH = Math.round(fontSize * 1.55);
  const maxLines = Math.max(1, Math.floor((height - 52 - 60) / lineH));
  const visible = shown.slice(-maxLines);
  // 窓の高さは、全部の行が出たときの高さに合わせる（途中で窓が伸び縮みしないように）
  const contentHeight = Math.max(4, Math.min(maxLines, el.lines.length)) * lineH + 60;
  const color = (t: string) =>
    /^\[ERROR|✘|ERROR/.test(t) ? "#ff6b6b" : /^\[WARN/.test(t) ? "#ffd166" : /^(✔|検査OK|動画:|OK)/.test(t) ? palette.accent : /^\s*→/.test(t) ? palette.subtext : "#c9d3e3";
  return (
    <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0 }}>
      <Window title={el.title} frame={frame} from={el.from} fpb={fpb} palette={palette} dark contentHeight={contentHeight} boxHeight={height}>
        <div style={{ padding: "28px 34px", fontFamily: MONO, fontSize, lineHeight: `${lineH}px` }}>
          {visible.map((l, i) => {
            const last = i === visible.length - 1;
            if (l.text.startsWith("$")) {
              const cmd = l.text.replace(/^\$\s*/, "");
              // 1文字 1.2 フレーム（src/motion/timeline.ts の typingFrames と同じ）
              const n = Math.min([...cmd].length, Math.floor((frame - l.from) / 1.2));
              const typing = n < [...cmd].length;
              return (
                <div key={i} data-gmm-text style={{ whiteSpace: "pre", color: "#f4f7fb" }}>
                  <span style={{ color: palette.accent }}>❯ </span>
                  {[...cmd].slice(0, n).join("")}
                  {(typing || last) && <Caret frame={frame} color={palette.accent} />}
                </div>
              );
            }
            return (
              <div key={i} data-gmm-text style={{ whiteSpace: "pre", color: color(l.text), opacity: ease(frame - l.from, 4) }}>
                {l.text}
              </div>
            );
          })}
        </div>
      </Window>
    </div>
  );
};

// ---- editor ----

/** markdown の行の色分け（台本の書式に合わせた簡単なもの） */
function mdColor(line: string, p: Palette): string {
  if (/^#{1,6}\s/.test(line)) return p.accent;
  if (/^\s*:::/.test(line)) return p.accent2;
  if (/^---$/.test(line) || /^\w+:\s/.test(line)) return p.subtext;
  return "#e6ebf3";
}

/** 1行が折り返して何段になるか（全角 1、半角 0.6 文字ぶんの幅で数える） */
function rowsOf(line: string, perRow: number): number {
  const w = [...line].reduce((n, c) => n + (/[\x20-\x7e]/.test(c) ? 0.6 : 1), 0);
  return Math.max(1, Math.ceil(w / perRow));
}

export const Editor: React.FC<PartProps<"editor">> = ({ el, frame, fpb, width, height, palette }) => {
  if (frame < el.from) return null;
  const all = el.code;
  const total = [...all].length;
  const k = el.typing ? Math.min(1, (frame - el.from) / Math.max(1, el.beats * fpb)) : 1;
  const n = Math.floor(total * k);
  const lines = [...all].slice(0, n).join("").split("\n");
  const fontSize = 28;
  const lineH = Math.round(fontSize * 1.6);
  // 行番号（70px）と右の余白を除いた幅に、何文字入るか
  const perRow = Math.max(8, Math.floor((width - 70 - 28 - 8) / fontSize));
  const maxRows = Math.max(1, Math.floor((height - 52 - 56) / lineH));
  const allRows = all.split("\n").reduce((r, l) => r + rowsOf(l, perRow), 0);
  const contentHeight = Math.max(4, Math.min(maxRows, allRows)) * lineH + 56;
  // 打ち込み中の行が見えるように、収まらない分だけ上の行を隠す
  let first = 0;
  let rows = lines.reduce((r, l) => r + rowsOf(l, perRow), 0);
  while (rows > maxRows && first < lines.length - 1) rows -= rowsOf(lines[first++], perRow);
  return (
    <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0 }}>
      <Window title={el.file} frame={frame} from={el.from} fpb={fpb} palette={palette} contentHeight={contentHeight} boxHeight={height}>
        <div style={{ padding: "26px 0", fontFamily: MONO, fontSize, lineHeight: `${lineH}px` }}>
          {lines.slice(first).map((l, i) => {
            const no = first + i + 1;
            const last = first + i === lines.length - 1;
            return (
              <div key={no} style={{ display: "flex", whiteSpace: "pre-wrap", paddingRight: 28 }}>
                <span style={{ width: 70, textAlign: "right", paddingRight: 22, color: "#4b566b", flex: "none" }}>{no}</span>
                {/* 長い行は折り返す（窓の右端で切れないように） */}
                <span data-gmm-text style={{ minWidth: 0, wordBreak: "break-all", color: el.lang === "markdown" ? mdColor(l, palette) : "#e6ebf3", fontWeight: /^#{1,6}\s/.test(l) ? 700 : 400 }}>
                  {l}
                  {last && (k < 1 || el.typing) && <Caret frame={frame} color={palette.accent} />}
                </span>
              </div>
            );
          })}
        </div>
      </Window>
    </div>
  );
};

// ---- clip ----

/** 検査用ページ（gmm check / frames）では動画を再生できないので、ffmpeg で切り出したコマを出す */
const inspecting = () => typeof window !== "undefined" && (window as unknown as { __gmmInspect?: boolean }).__gmmInspect === true;

export const Clip: React.FC<PartProps<"clip">> = ({ el, frame, fps, fpb, width, height, palette }) => {
  if (frame < el.from) return null;
  const a = ease(frame - el.from, fpb * 0.6);
  const bar = el.frame === "browser" ? 44 : 0;
  const capH = el.caption ? 70 : 0;
  // 16:9 の動画が枠に収まる大きさ
  const phone = el.frame === "phone";
  const maxW = width;
  const maxH = height - capH;
  const vw = phone ? Math.min(maxW, ((maxH - 36) * 9) / 19.5) : Math.min(maxW, ((maxH - bar) * 16) / 9);
  const vh = phone ? vw * (19.5 / 9) : (vw * 9) / 16;
  const t = el.start + (frame - el.from) / fps;
  const end = el.end ?? Infinity;
  const video = inspecting() ? (
    <Img src={`/__frame?src=${encodeURIComponent(el.src)}&t=${Math.min(t, end - 0.05).toFixed(3)}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <Sequence from={el.from} layout="none" durationInFrames={el.end !== undefined ? Math.max(1, Math.round((el.end - el.start) * fps)) : undefined}>
      <OffthreadVideo src={staticFile(el.src)} trimBefore={Math.round(el.start * fps)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </Sequence>
  );
  return (
    <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div
        style={{
          width: vw,
          height: vh + bar,
          borderRadius: phone ? 48 : 16,
          border: phone ? "16px solid #05070c" : "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden",
          background: "#000",
          boxShadow: `0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px ${palette.accent}33`,
          transform: `translateY(${(1 - a) * 60}px)`,
          opacity: a,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {bar > 0 && (
          <div style={{ height: bar, flex: "none", display: "flex", alignItems: "center", gap: 9, paddingLeft: 18, background: palette.surface }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
            ))}
          </div>
        )}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{video}</div>
      </div>
      {el.caption && (
        <div data-gmm-text style={{ fontSize: 40, fontWeight: 700, color: palette.text, fontFamily: palette.displayFontFamily, opacity: ease(frame - el.from - fpb * 0.5, fpb * 0.5) }}>
          {el.caption}
        </div>
      )}
    </div>
  );
};

// ---- features ----

export const Features: React.FC<PartProps<"features">> = ({ el, frame, fps, width, height, palette }) => {
  if (frame < el.from) return null;
  const n = el.items.length;
  const cols = el.columns ?? (n <= 3 ? n : n === 4 ? 2 : 3);
  const rows = Math.ceil(n / cols);
  const gap = 28;
  const cw = (width - gap * (cols - 1)) / cols;
  // 説明のないカードは低くする（題だけで中が空かないように）
  const ch = Math.min(el.items.some((it) => it.text) ? 260 : 150, (height - gap * (rows - 1)) / rows);
  const top = (height - (rows * ch + gap * (rows - 1))) / 2;
  return (
    <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0 }}>
      {el.items.map((it, i) => {
        if (it.from > frame) return null;
        const k = pop(frame - it.from, fps, 14);
        const c = i % 2 ? palette.accent2 : palette.accent;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i % cols) * (cw + gap),
              top: top + Math.floor(i / cols) * (ch + gap),
              width: cw,
              height: ch,
              boxSizing: "border-box",
              padding: "28px 32px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.045)",
              border: `1px solid ${c}55`,
              transform: `translateY(${(1 - k) * 40}px) scale(${0.94 + 0.06 * k})`,
              opacity: Math.min(1, k * 1.4),
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ width: 48, height: 6, borderRadius: 3, background: c }} />
            <div data-gmm-text style={{ fontSize: 46, fontWeight: 900, fontFamily: palette.displayFontFamily, color: palette.text, lineHeight: 1.2 }}>
              {it.title}
            </div>
            {it.text && (
              <div data-gmm-text style={{ fontSize: 30, color: palette.subtext, lineHeight: 1.45 }}>
                {it.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---- step ----

/** 手順の見出し。左寄せで、STEP の番号・大きな題・短い説明・進み具合の順に出る */
export const Step: React.FC<PartProps<"step">> = ({ el, frame, fps, fpb, width, palette }) => {
  if (frame < el.from) return null;
  const f = frame - el.from;
  const a1 = ease(f, fpb * 0.5);
  const a2 = pop(f - fpb * 0.25, fps, 16);
  const a3 = ease(f - fpb * 0.75, fpb * 0.6);
  const of = el.of ?? el.n;
  const num = (v: number) => String(v).padStart(2, "0");
  return (
    <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, paddingRight: width * 0.04 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: a1, transform: `translateX(${(1 - a1) * -30}px)` }}>
        <div
          data-gmm-text
          style={{ fontFamily: palette.numberFontFamily, fontWeight: 800, fontSize: 30, letterSpacing: "0.18em", color: palette.background, background: palette.accent, padding: "6px 18px", borderRadius: 999 }}
        >
          STEP {num(el.n)}
        </div>
        <div data-gmm-text style={{ fontFamily: palette.numberFontFamily, fontWeight: 600, fontSize: 30, letterSpacing: "0.12em", color: palette.subtext }}>
          / {num(of)}
        </div>
      </div>
      <div
        data-gmm-text
        style={{
          fontFamily: palette.displayFontFamily,
          fontWeight: 900,
          fontSize: Math.min(112, Math.floor((width * 0.95) / Math.max(4, [...el.title].length))),
          lineHeight: 1.15,
          color: palette.text,
          opacity: Math.min(1, a2 * 1.4),
          transform: `translateY(${(1 - a2) * 30}px)`,
          textShadow: "0 6px 40px rgba(0,0,0,0.45)",
        }}
      >
        {el.title}
      </div>
      {el.text && (
        <div data-gmm-text style={{ fontSize: 42, lineHeight: 1.5, fontWeight: 500, color: palette.subtext, whiteSpace: "pre-line", opacity: a3 }}>
          {el.text}
        </div>
      )}
      {/* 進み具合（いまの手順まで色が付く） */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, opacity: a1 }}>
        {Array.from({ length: of }, (_, i) => (
          <div key={i} style={{ width: 72, height: 8, borderRadius: 4, background: i < el.n ? palette.accent : "rgba(255,255,255,0.15)" }} />
        ))}
      </div>
    </div>
  );
};
