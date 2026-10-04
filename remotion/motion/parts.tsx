// モーション動画の組み込み部品。どれも画面全体を使う層で、frame は場面の頭からのフレーム。
// 部品のルート要素には data-gmm-el="backdrop"（層なので重なりの検査はしない）、文字には data-gmm-text を付ける。
import { Img, interpolate, staticFile } from "remotion";
import type { ResolvedMotionElement } from "../../src/motion/schema";
import { beatInfo, ease, formatNumber, pop, random, splitEmphasis, type Palette } from "./kit";

export type PartProps<T extends ResolvedMotionElement["type"]> = {
  el: Extract<ResolvedMotionElement, { type: T }>;
  frame: number;
  fps: number;
  fpb: number;
  width: number;
  height: number;
  palette: Palette;
};

const layer: React.CSSProperties = { position: "absolute", inset: 0 };
const DISPLAY_WEIGHT = 900;
/** 背景（3D・粒）の上でも読めるように、大きな文字に付ける影 */
const SHADOW = "0 6px 40px rgba(0, 0, 0, 0.55)";

/** **語** をアクセントの色で */
const Emph: React.FC<{ text: string; palette: Palette }> = ({ text, palette }) => (
  <>
    {splitEmphasis(text).map((p, i) => (
      <span key={i} style={p.em ? { color: palette.accent } : undefined}>
        {p.text}
      </span>
    ))}
  </>
);

/** 文字数から、横幅に収まる大きさを決める（全角 1、半角 0.55 で数える） */
function fitSize(text: string, maxWidth: number, max: number): number {
  const plain = text.replace(/\*\*/g, "");
  const w = [...plain].reduce((n, c) => n + (/[\x20-\x7e]/.test(c) ? 0.58 : 1), 0);
  return Math.floor(Math.min(max, (maxWidth / Math.max(1, w)) * 0.96));
}

// ---- kinetic ----

export const Kinetic: React.FC<PartProps<"kinetic">> = ({ el, frame, fps, fpb, width, height, palette }) => {
  const shown = el.lines.filter((l) => l.from <= frame);
  if (!shown.length) return null;
  const maxW = width - 240;
  const enter = (from: number) => frame - from;
  const style = (from: number, text: string): React.CSSProperties => {
    const f = enter(from);
    switch (el.style) {
      case "slide": {
        const k = ease(f, fpb * 0.5);
        return { transform: `translateY(${(1 - k) * 80}px)`, opacity: k };
      }
      case "blur": {
        const k = ease(f, fpb * 0.6);
        return { filter: `blur(${(1 - k) * 24}px)`, opacity: k, transform: `scale(${1.08 - 0.08 * k})` };
      }
      case "type":
        return {};
      default: {
        const k = pop(f, fps);
        return { transform: `scale(${0.6 + 0.4 * k})`, opacity: Math.min(1, k * 1.5) };
      }
    }
  };
  /** type: 1文字ずつ（半拍で出し切る） */
  const typed = (text: string, from: number) => {
    if (el.style !== "type") return text;
    const n = Math.floor(interpolate(enter(from), [0, fpb * 0.6], [0, [...text.replace(/\*\*/g, "")].length], { extrapolateRight: "clamp" }));
    // ** を数えずに n 文字目まで
    let out = "";
    let count = 0;
    for (const p of splitEmphasis(text)) {
      const take = [...p.text].slice(0, Math.max(0, n - count)).join("");
      count += [...p.text].length;
      out += p.em ? (take ? `**${take}**` : "") : take;
    }
    return out;
  };
  const pulse = 1 + 0.025 * beatInfo(frame - el.from, fpb).pulse;

  if (el.mode === "stack") {
    const longest = el.lines.reduce((a, l) => (l.text.length > a.length ? l.text : a), "");
    const size = el.size ?? Math.min(fitSize(longest, maxW, 180), Math.floor((height - 240) / el.lines.length / 1.25));
    return (
      <div data-gmm-el="backdrop" style={{ ...layer, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: size * 0.15 }}>
        {shown.map((l, i) => (
          <div
            key={i}
            data-gmm-text
            style={{ fontSize: size, fontWeight: DISPLAY_WEIGHT, color: palette.text, lineHeight: 1.1, whiteSpace: "nowrap", textShadow: SHADOW, ...style(l.from, l.text) }}
          >
            <Emph text={typed(l.text, l.from)} palette={palette} />
          </div>
        ))}
      </div>
    );
  }
  const cur = shown[shown.length - 1];
  const size = el.size ?? fitSize(cur.text, maxW, 260);
  return (
    <div data-gmm-el="backdrop" style={{ ...layer, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        data-gmm-text
        style={{
          fontSize: size,
          fontWeight: DISPLAY_WEIGHT,
          color: palette.text,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          letterSpacing: "-0.02em",
          textShadow: SHADOW,
          ...style(cur.from, cur.text),
          transform: `${style(cur.from, cur.text).transform ?? ""} scale(${pulse})`,
        }}
      >
        <Emph text={typed(cur.text, cur.from)} palette={palette} />
      </div>
    </div>
  );
};

// ---- counter ----

export const Counter: React.FC<PartProps<"counter">> = ({ el, frame, fpb, palette }) => {
  if (frame < el.from) return null;
  const f = frame - el.from;
  // 終わりでちょうど value になるよう、0〜1 にそろえた easeOutExpo
  const k = interpolate(f, [0, el.beats * fpb], [0, 1], { extrapolateRight: "clamp", easing: (t) => (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10)) });
  const current = el.start + (el.value - el.start) * k;
  const done = k >= 0.999;
  const glow = done ? beatInfo(f - el.beats * fpb, fpb).pulse : 0;
  const appear = ease(f, fpb * 0.5);
  return (
    <div data-gmm-el="backdrop" style={{ ...layer, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24, opacity: appear }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, color: palette.text, fontFamily: palette.monoFontFamily, fontWeight: 700 }}>
        {el.prefix && <span data-gmm-text style={{ fontSize: 110, color: palette.subtext }}>{el.prefix}</span>}
        <span data-gmm-text style={{ fontSize: 220, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", textShadow: `0 0 ${40 * glow}px ${palette.accent}` }}>
          {formatNumber(current, el.decimals)}
        </span>
        {el.suffix && <span data-gmm-text style={{ fontSize: 110, color: palette.accent }}>{el.suffix}</span>}
      </div>
      {el.label && (
        <div data-gmm-text style={{ fontSize: 56, color: palette.subtext, fontWeight: 700, opacity: ease(f - fpb * 0.5, fpb * 0.5) }}>
          {el.label}
        </div>
      )}
    </div>
  );
};

// ---- chart ----

export const Chart: React.FC<PartProps<"chart">> = ({ el, frame, fpb, width, height, palette }) => {
  if (frame < el.from) return null;
  const f = frame - el.from;
  const max = Math.max(...el.items.map((i) => i.value), 0) || 1;
  // 小数のある値はその桁まで出す（0.5 が 1 に丸まらないように）
  const decimals = Math.max(0, ...el.items.map((i) => (String(i.value).split(".")[1] ?? "").length));
  const left = 160;
  const right = width - 160;
  const top = el.title ? 220 : 160;
  const bottom = height - 180;
  const title = el.title && (
    <div data-gmm-text style={{ position: "absolute", left, top: 90, fontSize: 64, fontWeight: 900, color: palette.text, opacity: ease(f, fpb * 0.5) }}>
      {el.title}
    </div>
  );
  if (el.kind === "line") {
    // 両端のラベル（幅 300）が画面からはみ出さないよう、点は内側に置く
    const pl = left + 160;
    const pr = right - 160;
    const pts = el.items.map((it, i) => ({
      x: el.items.length === 1 ? width / 2 : pl + ((pr - pl) * i) / (el.items.length - 1),
      y: bottom - ((bottom - top - 60) * it.value) / max,
      it,
    }));
    const k = interpolate(f, [0, el.beats * fpb], [0, 1], { extrapolateRight: "clamp" });
    const len = pts.reduce((n, p, i) => (i ? n + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
    return (
      <div data-gmm-el="backdrop" style={layer}>
        {title}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <line x1={left} x2={right} y1={bottom} y2={bottom} stroke={palette.subtext} strokeWidth={2} opacity={0.5} />
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={palette.accent}
            strokeWidth={8}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - k)}
          />
          {pts.map((p, i) => {
            const shown = k >= i / Math.max(1, pts.length - 1) - 0.001;
            return shown ? <circle key={i} cx={p.x} cy={p.y} r={p.it.highlight ? 18 : 11} fill={p.it.highlight ? palette.accent2 : palette.accent} /> : null;
          })}
        </svg>
        {pts.map((p, i) => (
          <div key={i}>
            <div data-gmm-text style={{ position: "absolute", left: p.x - 150, width: 300, top: bottom + 24, textAlign: "center", fontSize: 32, color: palette.subtext }}>
              {p.it.label}
            </div>
            {k >= i / Math.max(1, pts.length - 1) && (
              <div
                data-gmm-text
                style={{ position: "absolute", left: p.x - 150, width: 300, top: p.y - 80, textAlign: "center", fontSize: 40, fontWeight: 700, color: p.it.highlight ? palette.accent2 : palette.text }}
              >
                {formatNumber(p.it.value, decimals)}
                {el.unit}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  // 横棒（ラベルが長くても読めるように）
  const n = el.items.length;
  const rowH = Math.min(150, (bottom - top) / n);
  const labelW = 380;
  const barMax = right - left - labelW - 220;
  return (
    <div data-gmm-el="backdrop" style={layer}>
      {title}
      {el.items.map((it, i) => {
        const k = interpolate(f, [i * fpb * 0.25, i * fpb * 0.25 + el.beats * fpb], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        const y = top + i * rowH + (bottom - top - n * rowH) / 2;
        const color = it.highlight ? palette.accent2 : palette.accent;
        return (
          <div key={i} style={{ position: "absolute", left, top: y, height: rowH * 0.7, display: "flex", alignItems: "center", gap: 24 }}>
            <div data-gmm-text style={{ width: labelW, textAlign: "right", fontSize: 48, fontWeight: 700, color: palette.text }}>
              {it.label}
            </div>
            <div style={{ width: barMax * (it.value / max) * k, height: rowH * 0.55, background: color, borderRadius: 8, boxShadow: it.highlight ? `0 0 30px ${color}` : undefined }} />
            <div data-gmm-text style={{ fontSize: 48, fontWeight: 700, color, fontFamily: palette.monoFontFamily, opacity: k > 0.05 ? 1 : 0 }}>
              {formatNumber(it.value * k, decimals)}
              {el.unit}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- history ----

export const History: React.FC<PartProps<"history">> = ({ el, frame, fpb, width, height, palette }) => {
  if (frame < el.from) return null;
  const gap = 460;
  const curIndex = Math.max(0, el.items.findLastIndex((it) => it.from <= frame));
  // いまの項目が画面の中央に来るよう、なめらかに横に送る
  const target = (i: number) => width / 2 - i * gap;
  const prevFrom = el.items[curIndex].from;
  const k = ease(frame - prevFrom, fpb * 0.8);
  const x = interpolate(k, [0, 1], [target(Math.max(0, curIndex - 1)), target(curIndex)]);
  const lineY = height / 2;
  return (
    <div data-gmm-el="backdrop" style={{ ...layer, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: lineY - 2, height: 4, background: palette.subtext, opacity: 0.35 }} />
      {el.items.map((it, i) => {
        if (it.from > frame) return null;
        const cx = x + i * gap;
        // 画面の端に近づいたら薄くし、端（安全領域）から出るものは描かない
        const edge = Math.min(cx - 200 - 48, width - 48 - (cx + 200));
        if (edge < 0) return null;
        const a = ease(frame - it.from, fpb * 0.6) * Math.min(1, edge / 120);
        const cur = i === curIndex;
        return (
          <div key={i} style={{ position: "absolute", left: cx - 200, width: 400, top: 0, height, opacity: a * (cur ? 1 : 0.45) }}>
            <div
              data-gmm-text
              style={{ position: "absolute", bottom: height - lineY + 40, width: 400, textAlign: "center", fontSize: cur ? 96 : 64, fontWeight: 900, color: cur ? palette.accent : palette.text, fontFamily: palette.monoFontFamily }}
            >
              {it.label}
            </div>
            <div
              style={{
                position: "absolute",
                left: 200 - 14,
                top: lineY - 14,
                width: 28,
                height: 28,
                borderRadius: 14,
                background: cur ? palette.accent : palette.subtext,
                boxShadow: cur ? `0 0 ${24 + 16 * beatInfo(frame - it.from, fpb).pulse}px ${palette.accent}` : undefined,
              }}
            />
            <div data-gmm-text style={{ position: "absolute", top: lineY + 48, width: 400, textAlign: "center", fontSize: 46, lineHeight: 1.4, color: palette.text, fontWeight: 700 }}>
              {it.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- hero ----

export const Hero: React.FC<PartProps<"hero">> = ({ el, frame, fpb, width, palette }) => {
  if (frame < el.from) return null;
  const f = frame - el.from;
  const size = fitSize(el.title, width - 280, 280);
  const sub = el.subtitle && (
    <div data-gmm-text style={{ fontSize: 52, color: palette.subtext, fontWeight: 700, marginTop: 28, opacity: ease(f - fpb, fpb * 0.6), transform: `translateY(${(1 - ease(f - fpb, fpb * 0.6)) * 20}px)` }}>
      {el.subtitle}
    </div>
  );
  let titleStyle: React.CSSProperties = {};
  let bar: React.ReactNode = null;
  if (el.style === "zoom") {
    const k = ease(f, fpb, (t) => 1 - Math.pow(1 - t, 4));
    titleStyle = { transform: `scale(${3 - 2 * k})`, filter: `blur(${(1 - k) * 30}px)`, opacity: k };
  } else if (el.style === "split") {
    const k = ease(f, fpb * 0.8);
    titleStyle = { clipPath: `inset(${50 - 50 * k}% 0 ${50 - 50 * k}% 0)`, letterSpacing: `${(1 - k) * 0.3}em` };
  } else {
    // reveal: 色の帯が左から右へ走り、その後ろに文字が残る
    const k = ease(f, fpb * 0.6, (t) => t);
    const k2 = ease(f - fpb * 0.6, fpb * 0.6, (t) => t);
    titleStyle = { clipPath: `inset(0 ${100 - 100 * k}% 0 0)` };
    bar = (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent2})`,
          clipPath: `inset(0 ${100 - 100 * k}% 0 ${100 * k2}%)`,
        }}
      />
    );
  }
  return (
    <div data-gmm-el="backdrop" style={{ ...layer, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <div data-gmm-text style={{ fontSize: size, fontWeight: 900, color: palette.text, lineHeight: 1.15, whiteSpace: "nowrap", letterSpacing: "-0.02em", textShadow: SHADOW, ...titleStyle }}>
          <Emph text={el.title} palette={palette} />
        </div>
        {bar}
      </div>
      {sub}
    </div>
  );
};

// ---- backdrop ----

export const Backdrop: React.FC<PartProps<"backdrop">> = ({ el, frame, fpb, width, height, palette }) => {
  if (frame < el.from) return null;
  const f = frame - el.from;
  const p = beatInfo(f, fpb).pulse;
  const t = f / fpb; // 拍で数えた時間
  switch (el.style) {
    case "grid": {
      const lines = [];
      const horizon = height * 0.45;
      for (let i = 0; i < 14; i++) {
        const z = ((i + (t * 0.5) % 1) / 14) ** 2;
        const y = horizon + (height - horizon) * z;
        lines.push(<line key={`h${i}`} x1={0} x2={width} y1={y} y2={y} stroke={palette.accent} strokeOpacity={0.15 + 0.5 * z} strokeWidth={1 + 2 * z} />);
      }
      for (let i = -12; i <= 12; i++) {
        lines.push(<line key={`v${i}`} x1={width / 2 + i * 30} y1={horizon} x2={width / 2 + i * 260} y2={height} stroke={palette.accent} strokeOpacity={0.3} strokeWidth={1.5} />);
      }
      return (
        <div data-gmm-el="backdrop" style={{ ...layer, background: `linear-gradient(180deg, ${palette.background} 0%, ${palette.background} 40%, ${palette.surface} 100%)` }}>
          <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.6 + 0.4 * p }}>
            {lines}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: horizon - 2, height: 4, background: palette.accent2, boxShadow: `0 0 ${30 + 30 * p}px ${palette.accent2}` }} />
        </div>
      );
    }
    case "particles":
    case "stars": {
      const n = el.style === "stars" ? 140 : 70;
      return (
        <div data-gmm-el="backdrop" style={{ ...layer, background: palette.background }}>
          <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: n }, (_, i) => {
              const speed = 0.2 + random(i * 3 + 1) * 0.8;
              const x = (random(i * 3) * width + t * 40 * speed * (el.style === "stars" ? 0.3 : 1)) % width;
              const y = (random(i * 3 + 2) * height - t * 25 * speed + height * 10) % height;
              const r = el.style === "stars" ? 1 + random(i) * 2.2 : 3 + random(i) * 9;
              const tw = el.style === "stars" ? 0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + i)) : 0.25 + 0.5 * random(i + 99);
              const c = i % 5 === 0 ? palette.accent2 : palette.accent;
              return <circle key={i} cx={x} cy={y} r={r * (1 + 0.35 * p)} fill={c} opacity={tw} />;
            })}
          </svg>
        </div>
      );
    }
    case "rays":
      return (
        <div data-gmm-el="backdrop" style={{ ...layer, background: palette.background, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: width / 2 - width,
              top: height / 2 - width,
              width: width * 2,
              height: width * 2,
              background: `repeating-conic-gradient(from ${t * 6}deg, ${palette.accentSoft} 0deg 8deg, transparent 8deg 22deg)`,
              opacity: 0.55 + 0.3 * p,
            }}
          />
          <div style={{ ...layer, background: `radial-gradient(circle at 50% 50%, transparent 0%, ${palette.background} 70%)` }} />
        </div>
      );
    default: {
      // gradient: 2つの光がゆっくり動く
      const ax = 30 + 20 * Math.sin(t * 0.25);
      const ay = 35 + 15 * Math.cos(t * 0.2);
      const bx = 70 + 20 * Math.cos(t * 0.22);
      const by = 65 + 15 * Math.sin(t * 0.27);
      return (
        <div
          data-gmm-el="backdrop"
          style={{
            ...layer,
            background: `radial-gradient(circle at ${ax}% ${ay}%, ${palette.accent}${hex(0.28 + 0.12 * p)} 0%, transparent 45%), radial-gradient(circle at ${bx}% ${by}%, ${palette.accent2}${hex(0.24 + 0.1 * p)} 0%, transparent 45%), ${palette.background}`,
          }}
        />
      );
    }
  }
};

/** 不透明度を #rrggbb の後ろに付ける 2 桁に */
const hex = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

// ---- shot ----

export const Shot: React.FC<PartProps<"shot">> = ({ el, frame, fpb, palette }) => {
  if (frame < el.from) return null;
  const f = frame - el.from;
  const a = ease(f, fpb * 0.8);
  const zoom = 1 + (el.zoom - 1) * Math.min(1, f / (fpb * 16));
  const w = el.frame === "phone" ? 520 : 1400;
  const h = el.frame === "phone" ? 920 : 760;
  const bar = el.frame === "browser" ? 48 : 0;
  return (
    <div data-gmm-el="backdrop" style={{ ...layer, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 28 }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: el.frame === "phone" ? 64 : 18,
          border: el.frame === "none" ? undefined : `${el.frame === "phone" ? 18 : 2}px solid ${el.frame === "phone" ? "#05070c" : palette.surface}`,
          background: palette.surface,
          overflow: "hidden",
          boxShadow: `0 40px 120px rgba(0,0,0,0.5), 0 0 0 1px ${palette.accent}33`,
          transform: `translateY(${(1 - a) * 120}px) rotateX(${(1 - a) * 18}deg)`,
          opacity: a,
          position: "relative",
        }}
      >
        {bar > 0 && (
          <div style={{ height: bar, background: palette.surface, display: "flex", alignItems: "center", gap: 10, paddingLeft: 20 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
            ))}
          </div>
        )}
        <div style={{ position: "absolute", top: bar, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          <Img src={staticFile(el.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: "50% 30%" }} />
        </div>
      </div>
      {el.caption && (
        <div data-gmm-text style={{ fontSize: 44, fontWeight: 700, color: palette.text, opacity: ease(f - fpb * 0.5, fpb * 0.5) }}>
          {el.caption}
        </div>
      )}
    </div>
  );
};
