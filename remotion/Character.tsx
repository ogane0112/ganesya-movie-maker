// F14: 立ち絵。口パクは音素タイミング、まばたきは決まった間隔（乱数は使わない）。
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { ResolvedCharacter, Timeline } from "../src/schema";
import { BuiltinCharacter } from "./parts/BuiltinCharacter";
import { BUILTIN_PALETTES } from "./builtinCharacter";
import { CHARACTER_MARGIN } from "./layout";


/** まばたきの間隔（30fps 換算のフレーム数）。順に繰り返す */
const BLINK_GAPS = [96, 132, 78, 150, 108, 120];
const BLINK_FRAMES = 4;

export function isBlinking(frame: number, fps: number): boolean {
  const scale = fps / 30;
  const total = BLINK_GAPS.reduce((a, b) => a + b, 0) * scale;
  let t = frame % total;
  for (const gap of BLINK_GAPS) {
    const g = gap * scale;
    if (t < g) return t >= g - BLINK_FRAMES * scale;
    t -= g;
  }
  return false;
}

/** 動画全体での「いまの文」と表情・口の状態 */
export function characterState(timeline: Timeline, frame: number) {
  let face = timeline.segment?.initialFace ?? timeline.character?.defaultFace ?? "normal";
  let mouthOpen = false;
  let speaking = false;
  for (const scene of timeline.scenes) {
    if (scene.start > frame) break;
    for (const s of scene.sentences) {
      const from = scene.start + s.from;
      if (from > frame) break;
      face = s.face ?? face;
      if (frame < from + s.durationInFrames) speaking = true;
      if (s.mouth.some(([a, b]) => frame >= scene.start + a && frame < scene.start + b)) mouthOpen = true;
    }
  }
  return { face, mouthOpen, speaking, blink: isBlinking(frame, timeline.meta.fps) };
}

export const Character: React.FC<{ timeline: Timeline; character: ResolvedCharacter }> = ({ timeline, character }) => {
  const frame = useCurrentFrame();
  const { fps } = timeline.meta;
  const { face, mouthOpen, speaking, blink } = characterState(timeline, frame);
  // 登場アニメーションは動画の最初だけ（シーン単位の書き出しでは2番目以降のシーンで出さない）
  const enter = (timeline.segment?.index ?? 0) > 0 ? 1 : interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // 話している間だけ、ゆっくり上下に揺れる
  const bob = speaking ? Math.sin((frame / fps) * Math.PI * 2 * 0.8) * 4 : 0;
  return (
    <div
      data-gmm-el="character"
      style={{
        position: "absolute",
        right: CHARACTER_MARGIN,
        bottom: 0,
        width: character.width,
        height: character.height,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40 + bob}px)`,
      }}
    >
      <CharacterArt character={character} face={face} mouthOpen={mouthOpen} blink={blink} />
    </div>
  );
};

/**
 * 立ち絵そのもの（置き場所は親が決める）。bust: 胸から上だけを出す（ゲーム実況の下の帯など）。
 * 胸から上の範囲は、レイヤーの立ち絵では表示範囲（crop）の上 45%、組み込みキャラでは上 70% とする。
 */
export const CharacterArt: React.FC<{ character: ResolvedCharacter; face: string; mouthOpen: boolean; blink: boolean; bust?: boolean }> = ({
  character,
  face,
  mouthOpen,
  blink,
  bust,
}) => {
  if (character.kind === "builtin") {
    const art = (
      <BuiltinCharacter
        face={face}
        mouthOpen={mouthOpen}
        blink={blink}
        palette={BUILTIN_PALETTES[(character.variant ?? "builtin") as keyof typeof BUILTIN_PALETTES]}
      />
    );
    if (!bust) return art;
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${100 / 0.7}%` }}>{art}</div>
      </div>
    );
  }
  const c = bust ? { ...character, crop: { ...character.crop, height: character.crop.height * 0.45 } } : character;
  return <CharacterLayers character={c} face={face} mouthOpen={mouthOpen} blink={blink} />;
};

const CharacterLayers: React.FC<{
  character: Extract<ResolvedCharacter, { kind: "layers" }>;
  face: string;
  mouthOpen: boolean;
  blink: boolean;
}> = ({ character, face, mouthOpen, blink }) => {
  const states = character.expressions[face] ?? character.expressions[character.defaultFace];
  const visible = new Set(states[blink ? (mouthOpen ? "blinkOpen" : "blink") : mouthOpen ? "open" : "closed"]);
  const { canvas, crop } = character;
  // 親の枠に表示範囲（crop）がぴったり収まるよう、割合で置く（枠の縦横比は crop と同じにしておく）
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  // 全レイヤーを常に置き、見せるものだけ不透明にする（切り替え時の読み込み待ちを避ける）
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: pct(-crop.x, crop.width),
          top: pct(-crop.y, crop.height),
          width: pct(canvas.width, crop.width),
          height: pct(canvas.height, crop.height),
          isolation: "isolate",
        }}
      >
        {character.layers.map((l, i) => (
          <Img
            key={l.src}
            src={staticFile(l.src)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: visible.has(i) ? l.opacity : 0,
              mixBlendMode: l.blend as React.CSSProperties["mixBlendMode"],
            }}
          />
        ))}
      </div>
    </div>
  );
};
