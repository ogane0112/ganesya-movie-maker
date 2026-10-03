// F14: 立ち絵。口パクは音素タイミング、まばたきは決まった間隔（乱数は使わない）。
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { ResolvedCharacter, Timeline } from "../src/schema";
import { BuiltinCharacter } from "./parts/BuiltinCharacter";
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
  let face = timeline.character?.defaultFace ?? "normal";
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
  const enter = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
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
      {character.kind === "builtin" ? (
        <BuiltinCharacter face={face} mouthOpen={mouthOpen} blink={blink} />
      ) : (
        <CharacterLayers character={character} face={face} mouthOpen={mouthOpen} blink={blink} />
      )}
    </div>
  );
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
  const scale = character.height / crop.height;
  // 全レイヤーを常に置き、見せるものだけ不透明にする（切り替え時の読み込み待ちを避ける）
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: -crop.x * scale,
          top: -crop.y * scale,
          width: canvas.width * scale,
          height: canvas.height * scale,
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
