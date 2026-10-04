// モーション動画の場面。部品を層として重ね、場面の頭で入り方（transition）を付ける。
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CUSTOM_SCENES } from "gmm-custom-scenes";
import type { ResolvedMotionElement } from "../../src/motion/schema";
import type { ResolvedScene, Timeline } from "../../src/schema";
import { beatInfo, paletteOf, random, type Palette } from "./kit";
import { Backdrop, Chart, Counter, Hero, History, Kinetic, Shot } from "./parts";
import { Clip, Editor, Features, Step, Terminal } from "./ui";
import type { Area } from "../../src/motion/schema";

/** 置き場所（area）の枠。画面の端から 80px、枠どうしは 40px あける */
export function areaBox(area: Area | undefined, W: number, H: number) {
  const m = 80;
  const g = 40;
  const hw = (W - 2 * m - g) / 2;
  const hh = (H - 2 * m - g) / 2;
  switch (area) {
    case "left":
      return { x: m, y: m, width: hw, height: H - 2 * m };
    case "right":
      return { x: m + hw + g, y: m, width: hw, height: H - 2 * m };
    case "top":
      return { x: m, y: m, width: W - 2 * m, height: hh };
    case "bottom":
      return { x: m, y: m + hh + g, width: W - 2 * m, height: hh };
    case "tl":
      return { x: m, y: m, width: hw, height: hh };
    case "tr":
      return { x: m + hw + g, y: m, width: hw, height: hh };
    case "bl":
      return { x: m, y: m + hh + g, width: hw, height: hh };
    case "br":
      return { x: m + hw + g, y: m + hh + g, width: hw, height: hh };
    case "center":
      return { x: W * 0.12, y: H * 0.1, width: W * 0.76, height: H * 0.8 };
    default:
      return { x: 0, y: 0, width: W, height: H };
  }
}
import { ThreeScene } from "./three";

export const MotionScene: React.FC<{ scene: ResolvedScene; timeline: Timeline }> = ({ scene, timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fpb = timeline.motion!.framesPerBeat;
  const palette = paletteOf(timeline.theme);
  return (
    <AbsoluteFill data-gmm-scene={scene.id} style={{ background: palette.background, color: palette.text, fontFamily: palette.fontFamily, overflow: "hidden" }}>
      <Transition kind={scene.transition ?? "cut"} frame={frame} fpb={fpb} palette={palette}>
        {(scene.motion ?? []).map((el, i) => {
          // 窓・カードの部品は、area がなければ中央の枠に置く（画面の端まで広げない）
          const boxed = el.type === "terminal" || el.type === "editor" || el.type === "clip" || el.type === "features";
          const box = areaBox(el.area ?? (boxed ? "center" : "full"), width, height);
          return (
            <div key={i} style={{ position: "absolute", left: box.x, top: box.y, width: box.width, height: box.height }}>
              <Layer el={el} frame={frame} fps={fps} fpb={fpb} width={box.width} height={box.height} palette={palette} sceneDuration={scene.durationInFrames} />
            </div>
          );
        })}
      </Transition>
    </AbsoluteFill>
  );
};

const Layer: React.FC<{
  el: ResolvedMotionElement;
  frame: number;
  fps: number;
  fpb: number;
  width: number;
  height: number;
  palette: Palette;
  sceneDuration: number;
}> = ({ el, sceneDuration, ...p }) => {
  switch (el.type) {
    case "kinetic":
      return <Kinetic el={el} {...p} />;
    case "counter":
      return <Counter el={el} {...p} />;
    case "chart":
      return <Chart el={el} {...p} />;
    case "history":
      return <History el={el} {...p} />;
    case "hero":
      return <Hero el={el} {...p} />;
    case "backdrop":
      return <Backdrop el={el} {...p} />;
    case "shot":
      return <Shot el={el} {...p} />;
    case "step":
      return <Step el={el} {...p} />;
    case "terminal":
      return <Terminal el={el} {...p} />;
    case "editor":
      return <Editor el={el} {...p} />;
    case "clip":
      return <Clip el={el} {...p} />;
    case "features":
      return <Features el={el} {...p} />;
    case "three":
      return (
        <Sequence from={el.from} layout="none">
          <ThreeScene el={el} fpb={p.fpb} palette={p.palette} />
        </Sequence>
      );
    case "custom": {
      const Scene = CUSTOM_SCENES[el.id];
      if (!Scene) return <Missing src={el.src} />;
      return (
        <Sequence from={el.from} layout="none">
          <CustomLayer Scene={Scene} el={el} {...p} durationInFrames={sceneDuration - el.from} />
        </Sequence>
      );
    }
  }
};

/** 場面のコードを、部品が出てからのフレームで呼ぶ */
const CustomLayer: React.FC<{
  Scene: NonNullable<(typeof CUSTOM_SCENES)[string]>;
  el: Extract<ResolvedMotionElement, { type: "custom" }>;
  fps: number;
  fpb: number;
  width: number;
  height: number;
  palette: Palette;
  durationInFrames: number;
}> = ({ Scene, el, fps, fpb, width, height, palette, durationInFrames }) => {
  const frame = useCurrentFrame();
  return (
    <div data-gmm-el="backdrop" data-gmm-custom={el.src} style={{ position: "absolute", inset: 0 }}>
      <Scene frame={frame} fps={fps} width={width} height={height} durationInFrames={durationInFrames} beat={beatInfo(frame, fpb)} palette={palette} props={el.props} />
    </div>
  );
};

const Missing: React.FC<{ src: string }> = ({ src }) => (
  <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6b6b", fontSize: 40 }}>
    <span data-gmm-text>場面のコードが読み込まれていません: {src}</span>
  </div>
);

/** 場面の入り方。最初の半拍（最大 15 フレーム）で入る */
const Transition: React.FC<{ kind: string; frame: number; fpb: number; palette: Palette; children: React.ReactNode }> = ({ kind, frame, fpb, palette, children }) => {
  const len = Math.min(Math.round(fpb * 0.5), 15);
  const k = interpolate(frame, [0, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const wrap = (style: React.CSSProperties, overlay?: React.ReactNode) => (
    <>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {overlay}
    </>
  );
  if (k >= 1 || kind === "cut") return wrap({});
  switch (kind) {
    case "fade":
      return wrap({ opacity: k });
    case "wipe":
      return wrap(
        { clipPath: `inset(0 ${100 - 100 * k}% 0 0)` },
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${100 * k}%`, width: 14, marginLeft: -7, background: palette.accent, boxShadow: `0 0 40px ${palette.accent}` }} />,
      );
    case "zoom":
      return wrap({ transform: `scale(${1.3 - 0.3 * k})`, filter: `blur(${(1 - k) * 16}px)`, opacity: Math.min(1, k * 2) });
    case "slide":
      return wrap({ transform: `translateX(${(1 - k) * 100}%)` });
    case "flash":
      return wrap({}, <AbsoluteFill style={{ background: "#ffffff", opacity: 1 - k }} />);
    case "glitch": {
      // 横に切れた帯がずれる（ずれ方は決まった乱数）
      const step = Math.floor(frame / 2);
      const off = (n: number) => (random(step * 31 + n) - 0.5) * 80 * (1 - k);
      return (
        <>
          <AbsoluteFill style={{ transform: `translateX(${off(1)}px)`, filter: `drop-shadow(${off(2) / 4}px 0 0 ${palette.accent2}) drop-shadow(${off(3) / 4}px 0 0 ${palette.accent})` }}>
            {children}
          </AbsoluteFill>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{ position: "absolute", left: 0, right: 0, top: `${random(step * 7 + i) * 100}%`, height: `${2 + random(step + i) * 6}%`, background: i % 2 ? palette.accent : palette.accent2, opacity: 0.35 * (1 - k), transform: `translateX(${off(i + 9)}px)` }}
            />
          ))}
        </>
      );
    }
    default:
      return wrap({});
  }
};
