// F9: BGM（ナレーション中は自動で音量を下げる）と場面転換の効果音
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import type { Timeline } from "../src/schema";

/** ナレーションの前後この長さで音量をなめらかに上げ下げする（フレーム） */
const DUCK_RAMP = 8;

/** 動画全体での「話している区間」 */
export function speechSpans(t: Timeline): [number, number][] {
  // 前のシーンから続く発言（carry）は二重に数えない
  return t.scenes.flatMap((sc) =>
    sc.sentences.filter((s) => !s.carry).map((s): [number, number] => [sc.start + s.from, sc.start + s.from + s.durationInFrames]),
  );
}

/** 話している度合い（0〜1）。話す前後 DUCK_RAMP フレームでなめらかに変わる */
export function speakingAmount(frame: number, spans: [number, number][]): number {
  let k = 0;
  for (const [a, b] of spans) {
    if (frame < a - DUCK_RAMP || frame > b + DUCK_RAMP) continue;
    k = Math.max(k, frame < a ? (frame - (a - DUCK_RAMP)) / DUCK_RAMP : frame > b ? (b + DUCK_RAMP - frame) / DUCK_RAMP : 1);
  }
  return k;
}

/** ゲーム実況: ゲーム音の倍率。実況中はこの割合まで下げる */
export const GAME_DUCK = 0.35;

/** frame での BGM の音量。ナレーション中は volume * duck、動画の最初と最後はフェードする */
export function bgmVolumeAt(frame: number, t: Timeline, spans: [number, number][]): number {
  const bgm = t.audio.bgm;
  if (!bgm) return 0;
  const k = speakingAmount(frame, spans);
  const fps = t.meta.fps;
  const fade = interpolate(frame, [0, fps, t.durationInFrames - 2 * fps, t.durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return bgm.volume * (1 - (1 - bgm.duck) * k) * fade;
}

export const Sound: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { bgm, se } = timeline.audio;
  const spans = speechSpans(timeline);
  return (
    <>
      {/* プレビューの音量は 1 までなので切り詰める（書き出しの合成 src/mix.ts は正確な値を使う） */}
      {bgm && <Audio src={staticFile(bgm.src)} loop volume={(f) => Math.min(1, bgmVolumeAt(f, timeline, spans))} />}
      {se &&
        timeline.scenes.slice(1).map((scene) => (
          <Sequence key={scene.id} from={scene.start} layout="none">
            <Audio src={staticFile(se.src)} volume={se.volume} />
          </Sequence>
        ))}
    </>
  );
};
