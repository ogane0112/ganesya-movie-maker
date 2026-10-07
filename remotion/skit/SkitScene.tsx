// ネタ動画（layout: skit）の場面。背景の上にキャラクターが立ち、台詞に合わせて動き・画面効果・テロップ・画像・スタンプが出る。
// 決まり：乱数は random(seed)、現在時刻は使わない（同じ台本なら同じ動画）。
import { AbsoluteFill, Img, Loop, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CastMember, ResolvedScene, Timeline } from "../../src/schema";
import type { ResolvedBg, SkitResolvedScene, StagePos } from "../../src/skit/schema";
import { CharacterArt, isBlinking } from "../Character";
import { isManju } from "../builtinCharacter";
import { random } from "../motion/kit";
import type { Theme } from "../theme";
import { figureSize, skitLayout, spotBox, stageX, type Box, type SkitLayout } from "./layout";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const DARK = "#1d1a24";

/** 縁取り。円周上に影を並べる（-webkit-text-stroke は文字の内側も塗りつぶすため） */
export function outline(r: number, color: string, steps = 20): string {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${color}`;
  }).join(", ");
}

export const SkitScene: React.FC<{ scene: ResolvedScene; timeline: Timeline; withAudio: boolean }> = ({ scene, timeline }) => {
  const frame = useCurrentFrame();
  const sk = scene.skit!;
  const L = skitLayout(timeline);
  const { theme } = timeline;
  const k = timeline.meta.fps / 30;
  const fxNow = sk.fx.filter((f) => frame >= f.from && frame < f.to);
  const has = (name: string) => fxNow.find((f) => f.fx === name);

  // 画面揺れ（全体）
  const shake = has("shake");
  const shakeAmp = shake ? 22 * (1 - (frame - shake.from) / Math.max(1, shake.to - shake.from)) : 0;
  const shakeT = shake ? `translate(${(random(frame * 3 + 1) - 0.5) * 2 * shakeAmp}px, ${(random(frame * 3 + 2) - 0.5) * 2 * shakeAmp}px)` : "";

  // 寄り（舞台だけ。話者の顔に寄る）
  const zoom = has("zoom");
  let zoomStyle: React.CSSProperties = {};
  if (zoom) {
    const p = easeOut(interpolate(frame, [zoom.from, zoom.from + 6 * k], [0, 1], CLAMP)) * interpolate(frame, [zoom.to - 4 * k, zoom.to], [1, 0], CLAMP);
    const target = figureOf(timeline, sk, zoom.who, zoom.from, L);
    const ox = target ? target.cx : L.W / 2;
    const oy = target ? target.top + target.height * 0.35 : L.H / 2;
    zoomStyle = { transform: `scale(${1 + 0.5 * p})`, transformOrigin: `${ox}px ${oy}px` };
  }
  const mono = has("mono");
  const lines = has("lines");
  const flash = has("flash");

  return (
    <AbsoluteFill data-gmm-scene={scene.id} style={{ overflow: "hidden", background: theme.background, fontFamily: theme.fontFamily }}>
      <Transition kind={sk.transition} frame={frame} k={k}>
        <AbsoluteFill style={{ transform: shakeT }}>
          {/* 舞台：背景と立ち絵 */}
          <AbsoluteFill style={{ ...zoomStyle, filter: mono ? "grayscale(1) contrast(1.1)" : undefined }}>
            <Background bg={sk.bg} theme={theme} frame={frame} fps={timeline.meta.fps} />
            {(timeline.cast ?? []).map((m, i) => (m.character ? <Figure key={m.name} member={m} index={i} scene={scene} timeline={timeline} frame={frame} L={L} /> : null))}
          </AbsoluteFill>
          {lines && <SpeedLines frame={frame} W={L.W} H={L.H} />}
          {/* 画像・テロップ・スタンプ */}
          {sk.pics.filter((p) => frame >= p.from && frame < p.to).map((p, i) => (
            <Pic key={i} pic={p} frame={frame} k={k} box={spotBox(L.content, p.pos)} />
          ))}
          {sk.captions.filter((c) => frame >= c.from && frame < c.to).map((c, i) => (
            <Caption key={i} cap={c} frame={frame} k={k} L={L} theme={theme} />
          ))}
          {sk.stamps.filter((s) => frame >= s.from && frame < s.to).map((s, i) => (
            <Stamp key={i} stamp={s} frame={frame} k={k} L={L} theme={theme} pos={stampPos(timeline, sk, s, L)} index={i} />
          ))}
          {timeline.meta.subtitles === "burn" && <Line scene={scene} timeline={timeline} frame={frame} L={L} />}
        </AbsoluteFill>
      </Transition>
      {L.banner && <Banner text={timeline.skit!.banner!} box={L.banner} theme={theme} portrait={L.portrait} />}
      {flash && <AbsoluteFill style={{ background: "#ffffff", opacity: interpolate(frame, [flash.from, flash.to], [0.95, 0], CLAMP) }} />}
    </AbsoluteFill>
  );
};

// ---- 舞台の上の人 ----

type FigureState = { on: number; x: number; face?: string; flip: boolean };

/** その人の、frame での立ち位置（出入り・移動のアニメーション込み）・表情・向き */
function slotAt(timeline: Timeline, sk: SkitResolvedScene, who: string, frame: number): FigureState | undefined {
  const s0 = sk.stage0[who];
  if (!s0) return undefined;
  const k = timeline.meta.fps / 30;
  const W = timeline.meta.width;
  const len = 12 * k;
  let on = s0.on ? 1 : 0;
  let x = stageX(timeline, s0.pos);
  let face = s0.face;
  let flip = s0.flip;
  for (const e of sk.events) {
    if (e.who !== who || e.from > frame) continue;
    const p = easeOut(interpolate(frame, [e.from, e.from + len], [0, 1], CLAMP));
    if (e.kind === "face") face = e.face;
    else if (e.kind === "act" && e.act === "flip") flip = !flip;
    else if (e.kind === "enter" || e.kind === "move") {
      const to = stageX(timeline, e.pos as StagePos);
      // 舞台にいなければ、近いほうの端の外から入ってくる
      const fromX = on < 0.5 ? (to < W / 2 ? -W * 0.25 : W * 1.25) : x;
      x = fromX + (to - fromX) * p;
      on = 1;
    } else if (e.kind === "exit") {
      const out = x < W / 2 ? -W * 0.3 : W * 1.3;
      x = x + (out - x) * p;
      on = p >= 1 ? 0 : 1;
    }
  }
  return { on, x, face, flip };
}

/** zoom などで使う、その人の絵の位置 */
function figureOf(timeline: Timeline, sk: SkitResolvedScene, who: string | undefined, frame: number, L: SkitLayout) {
  if (!who) return undefined;
  const m = timeline.cast?.find((c) => c.name === who);
  const st = slotAt(timeline, sk, who, frame);
  if (!m?.character || !st || st.on < 0.5) return undefined;
  const size = figureSize(m.character, L.charHeight);
  return { cx: st.x, top: L.H - size.height, ...size };
}

const Figure: React.FC<{ member: CastMember; index: number; scene: ResolvedScene; timeline: Timeline; frame: number; L: SkitLayout }> = ({
  member,
  index,
  scene,
  timeline,
  frame,
  L,
}) => {
  const ch = member.character!;
  const sk = scene.skit!;
  const st = slotAt(timeline, sk, member.name, frame);
  if (!st || st.on <= 0) return null;
  const { fps } = timeline.meta;
  const k = fps / 30;
  const size = figureSize(ch, L.charHeight);
  const mine = scene.sentences.filter((s) => s.speaker === member.name);
  const speaking = mine.some((s) => frame >= s.from && frame < s.from + s.durationInFrames);
  const mouthOpen = mine.some((s) => s.mouth.some(([a, b]) => frame >= a && frame < b));
  const manju = ch.kind === "builtin" && isManju(ch.variant);
  // 話している間は揺れる（まんじゅう型は弾む）
  const bob = speaking ? (manju ? -Math.abs(Math.sin((frame / fps) * Math.PI * 2.4)) * 10 : Math.sin((frame / fps) * Math.PI * 1.6) * 4) : 0;
  // 顔が画面の内側を向くよう、逆向きの絵は左右反転する
  const facing = ch.kind === "layers" ? ch.facing : undefined;
  const left = st.x < L.W / 2;
  const inward = (left && facing === "left") || (!left && facing === "right");
  const flip = inward !== st.flip;

  // 動き
  let dx = 0;
  let dy = bob;
  let rot = 0;
  let scale = 1;
  let sx = 1;
  let dim = false;
  for (const e of sk.events) {
    if (e.who !== member.name || e.kind !== "act" || frame < e.from) continue;
    const t = frame - e.from;
    const H = size.height;
    switch (e.act) {
      case "jump":
        if (t < 18 * k) dy -= Math.abs(Math.sin((Math.PI * t) / (9 * k))) * H * (t < 9 * k ? 0.14 : 0.08);
        break;
      case "shake":
        if (t < 14 * k) dx += Math.sin(t * 2.4) * H * 0.035 * (1 - t / (14 * k));
        break;
      case "nod":
        if (t < 16 * k) (dy += Math.abs(Math.sin((Math.PI * t) / (8 * k))) * H * 0.03), (rot += Math.sin((Math.PI * t) / (8 * k)) * 3);
        break;
      case "spin":
        if (t < 18 * k) sx *= Math.cos((2 * Math.PI * t) / (18 * k));
        break;
      case "grow":
      case "shrink":
      case "fall": {
        // 続く動き：6 フレームで入り、to から 6 フレームで戻る
        const p = easeOut(interpolate(frame, [e.from, e.from + 6 * k], [0, 1], CLAMP)) * interpolate(frame, [e.to, e.to + 6 * k], [1, 0], CLAMP);
        if (e.act === "grow") scale *= 1 + 0.28 * p;
        else if (e.act === "shrink") (scale *= 1 - 0.22 * p), (dim = dim || p > 0.5);
        else rot += (left ? -1 : 1) * 82 * p;
        break;
      }
      case "tremble":
        if (frame < e.to) dx += (random(frame * 7 + index) - 0.5) * size.height * 0.025;
        break;
    }
  }
  const bottom = manju ? -Math.round(size.height * 0.03) : 0;
  return (
    <div
      data-gmm-el="character"
      style={{
        position: "absolute",
        left: st.x - size.width / 2,
        bottom,
        width: size.width,
        height: size.height,
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale}) scaleX(${(flip ? -1 : 1) * sx})`,
        transformOrigin: "bottom center",
        filter: dim ? "brightness(0.75) saturate(0.7)" : undefined,
      }}
    >
      <CharacterArt character={ch} face={st.face ?? ch.defaultFace} mouthOpen={mouthOpen} blink={isBlinking(frame + index * 47, fps)} />
    </div>
  );
};

// ---- 背景 ----

const inspecting = () => typeof window !== "undefined" && (window as unknown as { __gmmInspect?: boolean }).__gmmInspect === true;

const Background: React.FC<{ bg: ResolvedBg; theme: Theme; frame: number; fps: number }> = ({ bg, theme, frame, fps }) => {
  const a = theme.accent;
  const b = theme.accent2 ?? theme.accent;
  const box: React.CSSProperties = { position: "absolute", inset: 0 };
  const el = (style: React.CSSProperties, children?: React.ReactNode) => (
    <div data-gmm-el="backdrop" style={{ ...box, ...style }}>
      {children}
    </div>
  );
  switch (bg.kind) {
    case "color":
      return el({ background: bg.color });
    case "image":
      return el({}, <Img src={staticFile(bg.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />);
    case "video":
      return el(
        { background: "#000" },
        inspecting() ? (
          <Img src={`/__frame?src=${encodeURIComponent(bg.src)}&t=${Math.max(0, ((frame / fps) % bg.seconds) - 0.05).toFixed(3)}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Loop durationInFrames={Math.max(1, Math.floor(bg.seconds * fps))}>
            <OffthreadVideo src={staticFile(bg.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Loop>
        ),
      );
  }
  switch (bg.pattern) {
    case "sunburst":
      // ぐるぐる回る放射（ネタ動画の定番）
      return el({ background: `repeating-conic-gradient(from ${frame * 0.6}deg at 50% 55%, ${b} 0deg 9deg, #fff3b0 9deg 18deg)` });
    case "dots":
      return el({
        backgroundColor: theme.accentSoft,
        backgroundImage: `radial-gradient(${a}55 22%, transparent 24%)`,
        backgroundSize: "90px 90px",
        backgroundPosition: `${frame * 0.8}px ${frame * 0.8}px`,
      });
    case "stripes":
      return el({ background: `repeating-linear-gradient(135deg, ${theme.accentSoft} 0 40px, ${theme.background} 40px 80px)`, backgroundPosition: `${frame}px 0` });
    case "sky":
      return el({ background: "linear-gradient(#7cc8ff, #d8f0ff 70%, #f4fbff)" }, <Clouds frame={frame} />);
    case "speed":
      return el({ background: "#ffffff" }, <SpeedLines frame={frame} W={1920} H={1920} dense />);
    case "night":
      return el({ background: "linear-gradient(#0b1030, #2a1f5c)" }, <Stars frame={frame} />);
    default:
      return el({ background: `linear-gradient(160deg, ${theme.accentSoft}, ${theme.background} 60%)` });
  }
};

const Clouds: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const y = 8 + random(i * 5 + 1) * 30;
      const w = 220 + random(i * 5 + 2) * 200;
      const x = ((random(i * 5 + 3) * 120 + frame * (0.03 + i * 0.01)) % 130) - 15;
      return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: w, height: w * 0.36, borderRadius: w, background: "rgba(255,255,255,0.9)", filter: "blur(2px)" }} />;
    })}
  </>
);

const Stars: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {Array.from({ length: 60 }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${random(i * 3 + 1) * 100}%`,
          top: `${random(i * 3 + 2) * 100}%`,
          width: 4,
          height: 4,
          borderRadius: 2,
          background: "#fff",
          opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + i)),
        }}
      />
    ))}
  </>
);

/** 集中線。2 フレームごとに線の並びが変わる */
const SpeedLines: React.FC<{ frame: number; W: number; H: number; dense?: boolean }> = ({ frame, W, H, dense }) => {
  const step = Math.floor(frame / 2);
  const n = dense ? 90 : 70;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.hypot(W, H);
  return (
    <svg data-gmm-el="backdrop" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = ((i + random(step * 131 + i) * 0.8) / n) * Math.PI * 2;
        const w = 0.006 + random(step * 17 + i) * 0.012;
        const inner = R * (0.22 + random(step * 29 + i) * 0.14);
        const p = (ang: number, r: number) => `${cx + Math.cos(ang) * r},${cy + Math.sin(ang) * r}`;
        return <polygon key={i} points={`${p(a, inner)} ${p(a - w, R)} ${p(a + w, R)}`} fill="#111" opacity={0.85} />;
      })}
    </svg>
  );
};

// ---- テロップ・画像・スタンプ ----

const Caption: React.FC<{ cap: SkitResolvedScene["captions"][number]; frame: number; k: number; L: SkitLayout; theme: Theme }> = ({ cap, frame, k, L, theme }) => {
  const t = frame - cap.from;
  const text = cap.text.replace(/\\n/g, "\n");
  const longest = Math.max(...text.split("\n").map((l) => [...l].length));
  const pos = cap.pos ?? (cap.style === "pop" ? "top" : cap.style === "note" ? "bottom" : "center");
  const box = cap.style === "title" ? L.content : spotBox(L.content, pos);
  const fit = (base: number) => Math.max(40, Math.min(base, Math.floor((box.width * 0.96) / Math.max(1, longest))));
  const accent = theme.accent2 ?? theme.accent;
  let inner: React.ReactNode;
  switch (cap.style) {
    case "impact": {
      // ドン！と大きくなって落ち着く
      const s = interpolate(t, [0, 5 * k, 9 * k], [2.2, 0.92, 1], CLAMP);
      inner = (
        <div
          data-gmm-text
          style={{
            fontSize: fit(L.portrait ? 132 : 150),
            fontWeight: 900,
            lineHeight: 1.15,
            color: accent,
            textShadow: `${outline(10, DARK)}, 0 12px 0 ${DARK}`,
            transform: `rotate(-4deg) scale(${s})`,
            opacity: interpolate(t, [0, 2], [0, 1], CLAMP),
          }}
        >
          {text}
        </div>
      );
      break;
    }
    case "shout": {
      const j = (n: number) => (random(frame * 5 + n) - 0.5) * 10;
      inner = (
        <div data-gmm-text style={{ fontSize: fit(L.portrait ? 120 : 136), fontWeight: 900, lineHeight: 1.15, color: theme.accent, textShadow: `${outline(8, "#ffffff")}, ${outline(13, DARK, 24)}`, transform: `translate(${j(1)}px, ${j(2)}px) scale(${interpolate(t, [0, 4 * k], [1.4, 1], CLAMP)})` }}>
          {text}
        </div>
      );
      break;
    }
    case "pop": {
      const s = interpolate(t, [0, 4 * k, 7 * k, 10 * k], [0, 1.12, 0.96, 1], CLAMP);
      inner = (
        <div data-gmm-text style={{ fontSize: fit(L.portrait ? 72 : 80), fontWeight: 900, lineHeight: 1.25, color: DARK, background: "#ffffff", border: `8px solid ${theme.accent}`, borderRadius: 28, padding: "10px 36px", boxShadow: `0 10px 0 ${DARK}`, transform: `scale(${s})` }}>
          {text}
        </div>
      );
      break;
    }
    case "note":
      inner = (
        <div data-gmm-text style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.4, color: "#ffffff", background: "rgba(20, 18, 28, 0.78)", borderRadius: 12, padding: "6px 22px", opacity: interpolate(t, [0, 6 * k], [0, 1], CLAMP) }}>
          {text}
        </div>
      );
      break;
    case "title": {
      // 横切る帯に大きな題（起承転結の見出し）
      const x = interpolate(t, [0, 8 * k], [-110, 0], { ...CLAMP, easing: easeOut });
      inner = (
        <div style={{ width: L.W, marginLeft: -box.x, display: "flex", justifyContent: "center", background: DARK, transform: `translateX(${x}%) skewY(-3deg)`, padding: "26px 0", borderTop: `10px solid ${accent}`, borderBottom: `10px solid ${accent}` }}>
          <div data-gmm-text style={{ fontSize: fit(L.portrait ? 110 : 120), fontWeight: 900, lineHeight: 1.2, color: "#ffffff", padding: "0 40px" }}>
            {text}
          </div>
        </div>
      );
      break;
    }
  }
  return (
    <div
      data-gmm-el="caption"
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        display: "flex",
        alignItems: pos === "top" || pos === "tl" || pos === "tr" ? "flex-start" : pos === "bottom" || pos === "bl" || pos === "br" ? "flex-end" : "center",
        justifyContent: "center",
        textAlign: "center",
        whiteSpace: "pre-line",
        pointerEvents: "none",
      }}
    >
      {inner}
    </div>
  );
};

const Pic: React.FC<{ pic: SkitResolvedScene["pics"][number]; frame: number; k: number; box: Box }> = ({ pic, frame, k, box }) => {
  const t = frame - pic.from;
  const p = interpolate(t, [0, 8 * k], [0, 1], CLAMP);
  const anim: React.CSSProperties =
    pic.anim === "pop"
      ? { transform: `scale(${interpolate(t, [0, 5 * k, 8 * k], [0.2, 1.08, 1], CLAMP)})` }
      : pic.anim === "slide"
        ? { transform: `translateX(${(1 - easeOut(p)) * 120}%)` }
        : pic.anim === "zoom"
          ? { transform: `scale(${1 + 0.06 * (t / (pic.to - pic.from))})`, opacity: p }
          : { opacity: p };
  const w = box.width * pic.size;
  const h = box.height * pic.size;
  return (
    <div style={{ position: "absolute", left: box.x + (box.width - w) / 2, top: box.y + (box.height - h) / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...anim }}>
      <Img
        data-gmm-el="pic"
        src={staticFile(pic.src)}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", boxSizing: "border-box", border: "8px solid #ffffff", borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}
      />
    </div>
  );
};

/** スタンプの置き場所。auto はその時の話者の頭の横（話者がいなければ右上） */
function stampPos(timeline: Timeline, sk: SkitResolvedScene, s: SkitResolvedScene["stamps"][number], L: SkitLayout): { x: number; y: number } {
  const c = L.content;
  if (s.pos === "auto") {
    const f = figureOf(timeline, sk, s.who, s.from, L);
    if (f) {
      const x = Math.max(140, Math.min(L.W - 140, f.cx + (f.cx < L.W / 2 ? 1 : -1) * f.width * 0.42));
      return { x, y: Math.max(c.y + 80, f.top + 40) };
    }
    return { x: c.x + c.width * 0.8, y: c.y + 100 };
  }
  const b = spotBox(c, s.pos);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

const Stamp: React.FC<{ stamp: SkitResolvedScene["stamps"][number]; frame: number; k: number; L: SkitLayout; theme: Theme; pos: { x: number; y: number }; index: number }> = ({
  stamp,
  frame,
  k,
  L,
  theme,
  pos,
  index,
}) => {
  const t = frame - stamp.from;
  const s = interpolate(t, [0, 4 * k, 7 * k], [0, 1.25, 1], CLAMP);
  const size = L.portrait ? 110 : 120;
  return (
    <div
      data-gmm-el="stamp"
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) rotate(${(random(index + stamp.from) - 0.5) * 24}deg) scale(${s})`,
        fontSize: size,
        fontWeight: 900,
        whiteSpace: "nowrap",
        color: theme.accent,
        textShadow: `${outline(7, "#ffffff")}, ${outline(11, DARK, 24)}`,
      }}
    >
      <span data-gmm-text>{stamp.text}</span>
    </div>
  );
};

const Banner: React.FC<{ text: string; box: Box; theme: Theme; portrait: boolean }> = ({ text, box, theme, portrait }) => {
  const len = [...text].length;
  const base = portrait ? 76 : 52;
  // 2 行までに収まる大きさ
  const size = Math.max(36, Math.min(base, Math.floor(((box.width - 80) * (portrait ? 2 : 1)) / Math.max(1, len))));
  return (
    <div data-gmm-el="banner" style={{ position: "absolute", left: box.x, top: box.y, width: box.width, height: box.height, background: DARK, borderBottom: `10px solid ${theme.accent2 ?? theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: "0 40px" }}>
      <div data-gmm-text data-gmm-clip-y style={{ fontSize: size, fontWeight: 900, lineHeight: 1.2, color: "#ffffff", textAlign: "center" }}>
        {text}
      </div>
    </div>
  );
};

// ---- 字幕 ----

/** いま出ている台詞（文の頭から次の文の頭まで。最後の文は話し終えて少しで消す） */
function currentLine(scene: ResolvedScene, frame: number) {
  const i = scene.sentences.findLastIndex((s) => s.from <= frame);
  const s = scene.sentences[i];
  if (!s) return undefined;
  if (i === scene.sentences.length - 1 && frame >= s.from + s.durationInFrames + 9) return undefined;
  return s;
}

const Line: React.FC<{ scene: ResolvedScene; timeline: Timeline; frame: number; L: SkitLayout }> = ({ scene, timeline, frame, L }) => {
  const s = currentLine(scene, frame);
  const style = timeline.skit!.subtitleStyle;
  if (!s || style === "none") return null;
  const cast = timeline.cast ?? [];
  const member = cast.find((c) => c.name === s.speaker);
  const named = cast.length > 1;
  const color = member?.color ?? "#ffffff";
  const sub = L.subtitle;
  const t = frame - s.from;
  // 吹き出し：話者の頭の上。立ち絵のない話者はふつうの字幕
  const fig = style === "bubble" ? figureOf(timeline, scene.skit!, s.speaker, frame, L) : undefined;
  if (fig) {
    const maxW = L.portrait ? L.W - 96 : Math.round(L.W * 0.46);
    const cx = Math.max(48 + maxW / 2, Math.min(L.W - 48 - maxW / 2, fig.cx));
    const bottom = L.H - fig.top - 20;
    const s2 = interpolate(t, [0, 4], [0.85, 1], CLAMP);
    return (
      <div data-gmm-subtitle style={{ position: "absolute", left: cx - maxW / 2, width: maxW, bottom, display: "flex", justifyContent: "center", transform: `scale(${s2})`, transformOrigin: "bottom center" }}>
        <div style={{ position: "relative", background: "#ffffff", border: `6px solid ${DARK}`, borderRadius: 40, padding: "14px 34px", boxShadow: "0 8px 0 rgba(0,0,0,0.25)" }}>
          <div data-gmm-subtitle-text style={{ fontSize: sub.fontSize, lineHeight: `${sub.lineHeight}px`, fontWeight: 800, color: DARK, textAlign: "center" }}>
            {s.text}
          </div>
          {/* しっぽ（話者のほうへ） */}
          <div style={{ position: "absolute", bottom: -34, left: `calc(50% + ${Math.max(-maxW / 2 + 60, Math.min(maxW / 2 - 60, fig.cx - cx))}px - 22px)`, width: 0, height: 0, borderLeft: "22px solid transparent", borderRight: "22px solid transparent", borderTop: `34px solid ${DARK}` }} />
          <div style={{ position: "absolute", bottom: -22, left: `calc(50% + ${Math.max(-maxW / 2 + 60, Math.min(maxW / 2 - 60, fig.cx - cx))}px - 14px)`, width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderTop: "24px solid #ffffff" }} />
        </div>
      </div>
    );
  }
  const textStyle: React.CSSProperties =
    style === "yukkuri"
      ? // ゆっくり：話者の色の文字に、白と黒の二重の縁
        { color: member ? color : "#ffffff", textShadow: `${outline(5, "#ffffff")}, ${outline(9, DARK, 24)}`, fontWeight: 900 }
      : style === "bold"
        ? // 太字：白い文字に話者の色と黒の縁（ショート動画の字幕）
          { color: "#ffffff", textShadow: `${outline(6, member && named ? color : DARK)}, ${outline(10, DARK, 24)}`, fontWeight: 900 }
        : // 箱：帯に白い文字
          { color: "#ffffff", fontWeight: 700, background: "rgba(20, 18, 28, 0.82)", border: member && named ? `4px solid ${color}` : undefined, borderRadius: 14, padding: "6px 30px" };
  return (
    <div data-gmm-subtitle style={{ position: "absolute", left: sub.x, width: sub.width, bottom: sub.bottom, minHeight: sub.lineHeight * 2 + 24, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        {named && member && style === "box" && (
          <div style={{ position: "absolute", top: -22, left: 20, fontSize: 26, lineHeight: "36px", padding: "0 12px", borderRadius: 8, background: color, color: "#fff", fontWeight: 700 }}>{member.name}</div>
        )}
        <div data-gmm-subtitle-text style={{ fontSize: sub.fontSize, lineHeight: `${sub.lineHeight}px`, textAlign: "center", ...textStyle }}>
          {s.text}
        </div>
      </div>
    </div>
  );
};

// ---- 場面の入り方 ----

const Transition: React.FC<{ kind: string; frame: number; k: number; children: React.ReactNode }> = ({ kind, frame, k, children }) => {
  const len = 10 * k;
  const p = easeOut(interpolate(frame, [0, len], [0, 1], CLAMP));
  if (p >= 1 || kind === "cut") return <AbsoluteFill>{children}</AbsoluteFill>;
  switch (kind) {
    case "fade":
      return <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>;
    case "slide":
      return <AbsoluteFill style={{ transform: `translateX(${(1 - p) * 100}%)` }}>{children}</AbsoluteFill>;
    case "zoom":
      return <AbsoluteFill style={{ transform: `scale(${1.3 - 0.3 * p})`, filter: `blur(${(1 - p) * 14}px)`, opacity: Math.min(1, p * 2) }}>{children}</AbsoluteFill>;
    case "wipe":
      return <AbsoluteFill style={{ clipPath: `inset(0 ${100 - 100 * p}% 0 0)` }}>{children}</AbsoluteFill>;
    case "flash":
      return (
        <>
          <AbsoluteFill>{children}</AbsoluteFill>
          <AbsoluteFill style={{ background: "#ffffff", opacity: 1 - p }} />
        </>
      );
    default:
      return <AbsoluteFill>{children}</AbsoluteFill>;
  }
};
