// F18: biim システムの画面。左上にゲーム、右に情報欄（タイトル・タイマー・区間）、下に話者と実況字幕。
import { Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { CastMember, ResolvedScene, RunInfo, Timeline } from "../../src/schema";
import { CharacterArt, isBlinking } from "../Character";
import type { Theme } from "../theme";
import { currentSplit, formatRunTime, runTimeAt, videoTimeAt } from "./run";

export const BIIM = { pad: 24, bandHeight: 262, panelMin: 420, bustHeight: 226 };
const C = { bg: "#0f1318", panel: "#1a2028", line: "#2c3540", text: "#f2f5f7", sub: "#9aa7b4", done: "#7fd17f" };

export function biimLayout(t: Timeline) {
  const { width: W, height: H } = t.meta;
  const run = t.run!;
  const { pad, bandHeight, panelMin } = BIIM;
  const maxH = H - bandHeight - pad * 2;
  const maxW = W - panelMin - pad * 3;
  const aspect = run.width / run.height;
  const gameH = Math.floor(Math.min(maxH, maxW / aspect));
  const gameW = Math.floor(gameH * aspect);
  const game = { x: pad, y: pad, width: gameW, height: gameH };
  const panel = { x: pad * 2 + gameW, y: pad, width: W - gameW - pad * 3, height: maxH };
  const band = { x: pad, y: H - bandHeight - pad + pad, width: W - pad * 2, height: bandHeight - pad };
  return { game, panel, band };
}

export const BiimScene: React.FC<{ scene: ResolvedScene; timeline: Timeline; withAudio: boolean }> = (props) =>
  props.timeline.run!.frame === "classic" ? <ClassicScene {...props} /> : <SimpleScene {...props} />;

/** ゲーム画面（録画を区間ごとに流す。倍速中は右上に倍率を出す） */
const Footage: React.FC<{ scene: ResolvedScene; timeline: Timeline; withAudio: boolean; frame: number }> = ({ scene, timeline, withAudio, frame }) => {
  const run = timeline.run!;
  const { fps } = timeline.meta;
  const global = (scene.globalStart ?? scene.start) + frame;
  const fast = scene.footage?.find((s) => s.rate !== 1 && frame >= s.from && frame < s.from + s.durationInFrames);
  return (
    <>
      {inspecting() ? (
        // 録画の最後のコマより後ろは切り出せないので、少し手前に寄せる
        <FootageStill run={run} t={Math.min(videoTimeAt(global, run, fps), videoTimeAt(Number.MAX_SAFE_INTEGER, run, fps) - 0.1)} />
      ) : (
        (scene.footage ?? []).map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames} layout="none">
            <OffthreadVideo
              src={staticFile(run.video)}
              trimBefore={Math.round(s.videoFrom * fps)}
              playbackRate={s.rate}
              muted={!withAudio || s.rate !== 1}
              volume={Math.min(1, run.gameVolume)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Sequence>
        ))
      )}
      {fast && <FastBadge rate={fast.rate} />}
    </>
  );
};

/** 箱を並べただけの枠（biimFrame: simple） */
const SimpleScene: React.FC<{ scene: ResolvedScene; timeline: Timeline; withAudio: boolean }> = ({ scene, timeline, withAudio }) => {
  const frame = useCurrentFrame();
  const run = timeline.run!;
  const { fps } = timeline.meta;
  const { game, panel, band } = biimLayout(timeline);
  const global = (scene.globalStart ?? scene.start) + frame;
  const runTime = runTimeAt(global, run, fps);
  const cur = currentSplit(runTime, run);
  return (
    <div data-gmm-scene={scene.id} style={{ position: "absolute", inset: 0, background: C.bg, color: C.text }}>
      {/* ゲーム画面 */}
      <div data-gmm-el="game" style={{ position: "absolute", ...pos(game), background: "#000", overflow: "hidden", borderRadius: 6 }}>
        <Footage scene={scene} timeline={timeline} withAudio={withAudio} frame={frame} />
      </div>

      {/* 情報欄 */}
      <div data-gmm-el="panel" style={{ position: "absolute", ...pos(panel), background: C.panel, borderRadius: 10, padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 22 }}>
        <div data-gmm-text style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.35 }}>{timeline.meta.title}</div>
        {run.category && (
          <div data-gmm-text style={{ fontSize: 28, color: C.sub }}>
            {run.category}
          </div>
        )}
        <div
          data-gmm-text
          style={{ fontFamily: timeline.theme.codeFontFamily, fontSize: 64, fontWeight: 700, color: cur >= run.splits.length ? C.done : C.text, fontVariantNumeric: "tabular-nums" }}
        >
          {formatRunTime(runTime)}
        </div>
        <Splits run={run} cur={cur} font={timeline.theme.codeFontFamily} accent={timeline.theme.accent} />
      </div>

      {/* 下の帯：話者と実況 */}
      <Band scene={scene} timeline={timeline} box={band} frame={frame} />
    </div>
  );
};

/** 検査用ページ（gmm check / frames）では、録画のコマを ffmpeg で切り出した画像で見せる */
const inspecting = () => typeof window !== "undefined" && (window as unknown as { __gmmInspect?: boolean }).__gmmInspect === true;

const FootageStill: React.FC<{ run: RunInfo; t: number }> = ({ run, t }) => (
  <Img
    src={`/__frame?src=${encodeURIComponent(run.video)}&t=${t.toFixed(3)}`}
    style={{ width: "100%", height: "100%", objectFit: "contain" }}
  />
);

const pos = (b: { x: number; y: number; width: number; height: number }) => ({ left: b.x, top: b.y, width: b.width, height: b.height });

const FastBadge: React.FC<{ rate: number }> = ({ rate }) => (
  <div style={{ position: "absolute", right: 16, top: 16, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 36, fontWeight: 700, padding: "4px 18px", borderRadius: 10 }}>
    ▶▶ ×{rate}
  </div>
);

const Splits: React.FC<{ run: RunInfo; cur: number; font: string; accent: string }> = ({ run, cur, font, accent }) => {
  // 区間が多いときは、いまの区間の前後だけを出す
  const max = 9;
  const from = Math.max(0, Math.min(cur - 3, run.splits.length - max));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {run.splits.slice(from, from + max).map((s, k) => {
        const i = from + k;
        const state = i < cur ? "done" : i === cur ? "now" : "next";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              padding: "6px 14px",
              borderRadius: 8,
              background: state === "now" ? accent : "transparent",
              color: state === "next" ? C.sub : C.text,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <span data-gmm-text style={{ fontSize: 30, fontWeight: state === "now" ? 700 : 400 }}>
              {s.name}
            </span>
            <span style={{ fontFamily: font, fontSize: 30, color: state === "done" ? C.done : "inherit" }}>{state === "done" ? formatRunTime(s.endRunTime) : "-"}</span>
          </div>
        );
      })}
    </div>
  );
};

const Band: React.FC<{ scene: ResolvedScene; timeline: Timeline; box: ReturnType<typeof biimLayout>["band"]; frame: number }> = ({ scene, timeline, box, frame }) => {
  const cast = timeline.cast ?? [];
  const { showing, speaking } = currentLine(scene, frame);
  const left = cast[0];
  const right = cast[1];
  const sub = timeline.theme.subtitle;
  const member = cast.find((c) => c.name === showing?.speaker);
  return (
    <div style={{ position: "absolute", ...pos(box), background: C.panel, borderRadius: 12, display: "flex", alignItems: "flex-end", gap: 20, padding: "0 20px", boxSizing: "border-box", overflow: "hidden" }}>
      {left?.character && <Bust member={left} index={0} scene={scene} timeline={timeline} frame={frame} speaking={speaking === left.name} />}
      <div data-gmm-subtitle style={{ flex: 1, alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, minWidth: 0 }}>
        {showing && member && (
          <div data-gmm-text style={{ fontSize: 28, fontWeight: 700, color: member.color, background: "#fff", alignSelf: "flex-start", padding: "0 14px", borderRadius: 8 }}>
            {member.name}
          </div>
        )}
        <div data-gmm-subtitle-text style={{ fontSize: sub.fontSize, lineHeight: `${Math.round(sub.fontSize * 1.35)}px`, fontWeight: 700, color: C.text }}>
          {showing?.text ?? ""}
        </div>
      </div>
      {right?.character && <Bust member={right} index={1} scene={scene} timeline={timeline} frame={frame} speaking={speaking === right.name} />}
    </div>
  );
};

/** 話者の胸から上。話している人は明るく、口パクする。表情はその人の直近の指定 */
const Bust: React.FC<{ member: CastMember; index: number; scene: ResolvedScene; timeline: Timeline; frame: number; speaking: boolean }> = ({
  member,
  index,
  scene,
  timeline,
  frame,
  speaking,
}) => {
  const ch = member.character!;
  const { face, mouthOpen } = speakerState(member, scene, timeline, frame);
  const aspect = ch.kind === "builtin" ? 340 / (500 * 0.7) : ch.crop.width / (ch.crop.height * 0.45);
  const h = BIIM.bustHeight;
  return (
    <div
      data-gmm-el="character"
      style={{
        position: "relative",
        flex: "none",
        width: Math.round(h * aspect),
        height: h,
        opacity: speaking ? 1 : 0.6,
        transform: `scale(${speaking ? 1 : 0.94})`,
        transformOrigin: "bottom center",
      }}
    >
      <CharacterArt character={ch} face={face} mouthOpen={mouthOpen} blink={isBlinking(frame + index * 47, timeline.meta.fps)} bust />
    </div>
  );
};

/** いま字幕に出ている発言と、いま話している人（話し終えて少しの間は字幕だけ残す） */
function currentLine(scene: ResolvedScene, frame: number) {
  const i = scene.sentences.findLastIndex((s) => s.from <= frame);
  const s = scene.sentences[i];
  const last = i === scene.sentences.length - 1;
  const showing = s && !(last && frame >= s.from + s.durationInFrames + 9) ? s : undefined;
  const speaking = showing && frame < showing.from + showing.durationInFrames ? showing.speaker : undefined;
  return { showing, speaking };
}

/** その人のいまの表情と口 */
function speakerState(member: CastMember, scene: ResolvedScene, timeline: Timeline, frame: number) {
  const own = scene.sentences.filter((s) => s.speaker === member.name && s.from <= frame);
  const face = own[own.length - 1]?.face ?? initialFace(timeline, scene, member.name) ?? member.character!.defaultFace;
  const mouthOpen = own.some((s) => s.mouth.some(([a, b]) => frame >= a && frame < b));
  return { face, mouthOpen };
}

/** シーンが始まる時点のその人の表情（前のシーンから引き継ぐ） */
function initialFace(t: Timeline, scene: ResolvedScene, name: string): string | undefined {
  if (t.segment?.initialFaces) return t.segment.initialFaces[name];
  let face: string | undefined;
  for (const s of t.scenes) {
    if (s.id === scene.id) break;
    for (const x of s.sentences) if (x.speaker === name && !x.carry && x.face) face = x.face;
  }
  return face;
}

// ---- 定番の biim 枠（biimFrame: classic） ----
// 1920×1080 での配置。左上にゲーム（16:9）、右上の箱にタイマー、右の縦長の箱に題名と区間、下の箱に字幕、左下の円に話している人。
export const CLASSIC = {
  game: { x: 34, y: 24, width: 1344, height: 756 },
  top: { x: 1416, y: 82, width: 458, height: 250 },
  side: { x: 1416, y: 348, width: 458, height: 698 },
  bottom: { x: 295, y: 809, width: 1080, height: 235 },
  circle: { cx: 92, cy: 982, r: 196 },
};
const LINE = "rgba(235, 238, 242, 0.92)";

const ClassicScene: React.FC<{ scene: ResolvedScene; timeline: Timeline; withAudio: boolean }> = ({ scene, timeline, withAudio }) => {
  const frame = useCurrentFrame();
  const run = timeline.run!;
  const { fps } = timeline.meta;
  const global = (scene.globalStart ?? scene.start) + frame;
  const runTime = runTimeAt(global, run, fps);
  const cur = currentSplit(runTime, run);
  const font = timeline.theme.codeFontFamily;
  const { showing, speaking } = currentLine(scene, frame);
  // 円には、いま話している人（黙っている間は最後に話した人）を出す
  const cast = (timeline.cast ?? []).filter((c) => c.character);
  const lastSpeaker = [...scene.sentences].reverse().find((s) => s.from <= frame)?.speaker;
  const inCircle = cast.find((c) => c.name === (speaking ?? lastSpeaker)) ?? cast[0];
  const member = (timeline.cast ?? []).find((c) => c.name === showing?.speaker);
  const sub = timeline.theme.subtitle;
  const drawLines = !run.frameImage;
  const box = (b: { x: number; y: number; width: number; height: number }): React.CSSProperties => ({
    position: "absolute",
    ...pos(b),
    boxSizing: "border-box",
    border: drawLines ? `3px solid ${LINE}` : undefined,
  });
  const c = CLASSIC.circle;
  return (
    <div data-gmm-scene={scene.id} style={{ position: "absolute", inset: 0, background: "#000", color: C.text }}>
      <div data-gmm-el="game" style={{ position: "absolute", ...pos(CLASSIC.game), background: "#000", overflow: "hidden" }}>
        <Footage scene={scene} timeline={timeline} withAudio={withAudio} frame={frame} />
      </div>

      {/* 枠の画像があれば、線の代わりに重ねる（ゲームの所は透明） */}
      {run.frameImage && <Img src={staticFile(run.frameImage)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />}

      {/* 右上：タイマー */}
      <div data-gmm-el="panel" style={{ ...box(CLASSIC.top), display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
        <div data-gmm-text style={{ fontSize: 30, color: C.sub }}>
          {cur < run.splits.length ? run.splits[cur].name : "FINISH"}
        </div>
        <div data-gmm-text style={{ fontFamily: font, fontSize: 76, fontWeight: 700, color: cur >= run.splits.length ? C.done : C.text, fontVariantNumeric: "tabular-nums" }}>
          {formatRunTime(runTime)}
        </div>
      </div>

      {/* 右：題名・カテゴリ・区間 */}
      <div data-gmm-el="panel" style={{ ...box(CLASSIC.side), padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div data-gmm-text style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.35 }}>{timeline.meta.title}</div>
        {run.category && (
          <div data-gmm-text style={{ fontSize: 28, color: C.sub }}>
            {run.category}
          </div>
        )}
        <Splits run={run} cur={cur} font={font} accent={timeline.theme.accent} />
      </div>

      {/* 下：字幕 */}
      <div style={{ ...box(CLASSIC.bottom), padding: "18px 32px", display: "flex" }}>
        <div data-gmm-subtitle style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, minWidth: 0 }}>
          {showing && member && (
            <div data-gmm-text style={{ fontSize: 28, fontWeight: 700, color: member.color, background: "#fff", alignSelf: "flex-start", padding: "0 14px", borderRadius: 8 }}>
              {member.name}
            </div>
          )}
          <div data-gmm-subtitle-text style={{ fontSize: sub.fontSize, lineHeight: `${Math.round(sub.fontSize * 1.35)}px`, fontWeight: 700 }}>
            {showing?.text ?? ""}
          </div>
        </div>
      </div>

      {/* 左下の円：話している人の顔 */}
      <div data-gmm-el="character" style={{ position: "absolute", left: c.cx - c.r, top: c.cy - c.r, width: c.r * 2, height: c.r * 2 }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", overflow: "hidden", background: "#000" }}>
          {inCircle && <CircleFace member={inCircle} scene={scene} timeline={timeline} frame={frame} index={cast.indexOf(inCircle)} />}
        </div>
        {drawLines && (
          <svg viewBox="0 0 400 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <circle cx="200" cy="200" r="196" fill="none" stroke={LINE} strokeWidth="6" />
            <circle cx="200" cy="200" r="182" fill="none" stroke="rgba(235,238,242,0.55)" strokeWidth="2" strokeDasharray="300 90 160 70" />
            <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(235,238,242,0.35)" strokeWidth="2" strokeDasharray="120 60 260 140" />
          </svg>
        )}
      </div>
    </div>
  );
};

/** 円の中の顔（胸から上を円に合わせて大きめに） */
const CircleFace: React.FC<{ member: CastMember; scene: ResolvedScene; timeline: Timeline; frame: number; index: number }> = ({ member, scene, timeline, frame, index }) => {
  const ch = member.character!;
  const { face, mouthOpen } = speakerState(member, scene, timeline, frame);
  const aspect = ch.kind === "builtin" ? 340 / (500 * 0.7) : ch.crop.width / (ch.crop.height * 0.45);
  // 円は画面の左下にはみ出しているので、画面に見えている部分の真ん中に顔が来るように置く
  const { cx, cy, r } = CLASSIC.circle;
  const visible = { x: (0 + cx + r * 0.75) / 2, y: (cy - r + 1080) / 2 };
  const local = { x: visible.x - (cx - r) - 10, y: visible.y - (cy - r) - 10 }; // 円の内側（inset 10）基準
  const h = 300;
  const w = h * aspect;
  // 胸像の中での顔の中心（割合）。character.json の face があればそれを使う
  const f =
    ch.kind === "builtin"
      ? { x: 0.5, y: 200 / 350 }
      : ch.face
        ? { x: (ch.face.x - ch.crop.x) / ch.crop.width, y: (ch.face.y - ch.crop.y) / (ch.crop.height * 0.45) }
        : { x: 0.5, y: 0.4 };
  return (
    <div style={{ position: "absolute", left: local.x - f.x * w, top: local.y - f.y * h, width: w, height: h }}>
      <CharacterArt character={ch} face={face} mouthOpen={mouthOpen} blink={isBlinking(frame + index * 47, timeline.meta.fps)} bust />
    </div>
  );
};
