// ネタ動画のタイムライン。台詞の長さでタイミングが決まり、指示（Cue）は台詞の頭（場面の最後の指示は最後の台詞の後）で起きる。
// 舞台の状態（誰がどこに立っているか・表情・向き）は場面をまたいで引き継ぎ、場面ごとに stage0 として持たせる
// （場面ごとに書き出しても同じ絵になるように）。
import type { Theme } from "../../remotion/theme.js";
import type { AudioTiming, CastMember, ResolvedScene, SceneDoc, Timeline, TimelineAudio } from "../schema.js";
import type { Cue, ResolvedBg, SkitInfo, SkitResolvedScene, StageEvent, StagePos, StageSlot } from "./schema.js";
import { SKIT_SE, skitSePath } from "./sfx.js";

/** 場面の頭の間・台詞の間・場面の終わりの余韻（秒）。ネタ動画はテンポよく */
export const SKIT_PACING = { leadIn: 0.25, gap: 0.2, tail: 0.7, afterTailCue: 1.4 };

/** 続く動き（次の台詞まで続く）と、一瞬の動きの長さ（フレーム, 30fps 換算） */
export const SUSTAINED_ACTS = new Set(["grow", "shrink", "fall", "tremble"]);
export const ACT_FRAMES: Record<string, number> = { jump: 18, shake: 14, nod: 16, spin: 18, flip: 1 };

/** 一瞬の画面効果の長さ（フレーム, 30fps 換算）。それ以外は次の台詞まで続く */
export const FX_FRAMES: Record<string, number> = { shake: 16, flash: 10 };

/** 効果音の解決：組み込みの名前ならそのパス、ファイルならパイプラインがコピーしたパス（seFiles） */
export type SeResolver = (se: string) => string;

export function defaultSeResolver(seFiles: Record<string, string> = {}): SeResolver {
  return (se) => {
    if (SKIT_SE[se]) return skitSePath(se);
    if (seFiles[se]) return seFiles[se];
    throw new Error(`効果音「${se}」がありません（組み込みは ${Object.keys(SKIT_SE).join(" / ")}。ファイルなら台本からの相対パス）`);
  };
}

export function skitInfo(doc: SceneDoc): SkitInfo {
  const { style, format, subtitleStyle, banner } = doc.meta;
  return {
    format,
    style,
    subtitleStyle: subtitleStyle ?? (style === "yukkuri" ? "yukkuri" : style === "anime" ? "bubble" : "bold"),
    ...(banner && { banner }),
  };
}

export function buildSkitTimeline(
  doc: SceneDoc,
  audio: AudioTiming,
  theme: Theme,
  cast: CastMember[],
  opts: { audio?: TimelineAudio; resolveSe?: SeResolver; bgs?: Record<string, ResolvedBg> } = {},
): Timeline {
  const { fps } = doc.meta;
  const sec = (s: number) => Math.round(s * fps);
  const k = fps / 30;
  const resolveSe = opts.resolveSe ?? defaultSeResolver();
  const info = skitInfo(doc);

  // 舞台の初期状態：立ち絵のある人は全員、話者の順に左・右・真ん中に立っている
  const defaultPos: StagePos[] = ["left", "right", "center"];
  const stage: Record<string, StageSlot> = {};
  cast.forEach((m, i) => {
    if (m.character) stage[m.name] = { on: true, pos: defaultPos[i] ?? "center", face: m.character.defaultFace, flip: false };
  });

  const scenes: ResolvedScene[] = [];
  let start = 0;
  let lastBg: ResolvedBg = { kind: "pattern", pattern: info.style === "anime" ? "sky" : info.style === "yukkuri" ? "gradient" : "sunburst" };
  let lastSpeaker: string | undefined;
  for (const scene of doc.scenes) {
    const clips = audio.sentences.filter((a) => a.sceneId === scene.id).sort((a, b) => a.index - b.index);
    if (clips.length !== scene.sentences.length) throw new Error(`シーン ${scene.id} の音声が揃っていません`);
    const def = scene.skit ?? { transition: "cut" as const, tail: [] };
    const stage0 = structuredClone(stage);
    const events: StageEvent[] = [];
    const out: SkitResolvedScene = { bg: lastBg, transition: def.transition, stage0, events, captions: [], stamps: [], pics: [], fx: [] };
    if (def.bg) out.bg = lastBg = opts.bgs?.[def.bg] ?? parseBgSpec(def.bg);
    const sounds: NonNullable<ResolvedScene["sounds"]> = [];

    let cursor = sec(SKIT_PACING.leadIn);
    const sentences = clips.map((c, i) => {
      const s = scene.sentences[i];
      const from = (i === 0 ? cursor : cursor + sec(SKIT_PACING.gap)) + sec(s.wait ?? 0);
      const durationInFrames = Math.max(1, Math.ceil(c.seconds * fps));
      cursor = from + durationInFrames;
      const mouth = c.mouth.map(([a, b]): [number, number] => [from + Math.round(a * fps), from + Math.max(Math.round(b * fps), Math.round(a * fps) + 1)]);
      return { text: c.text, from, durationInFrames, audio: c.file, mouth, ...(s.speaker && { speaker: s.speaker }), ...(s.face && { face: s.face }) };
    });
    // 最後の台詞の後の指示（オチ）があれば、その後に余韻を長めに取る
    const tailCues = def.tail ?? [];
    const tailAt = (sentences.length ? cursor + sec(SKIT_PACING.gap) : sec(SKIT_PACING.leadIn)) + sec(def.tailWait ?? 0);
    const durationInFrames = Math.max(
      tailCues.length ? tailAt + sec(SKIT_PACING.afterTailCue) : (sentences.length ? cursor : tailAt) + sec(SKIT_PACING.tail),
      sec(1),
    );
    /** 時点 f の後で最初に始まる台詞の頭（なければ場面の終わり） */
    const nextLine = (f: number) => sentences.find((s) => s.from > f)?.from ?? durationInFrames;

    const apply = (cues: Cue[], from: number, speaker: string | undefined) => {
      for (const cue of cues) {
        switch (cue.kind) {
          case "caption": {
            // 前のテロップはここで消える
            for (const c of out.captions) if (c.to > from) c.to = from;
            if (cue.text) out.captions.push({ from, to: durationInFrames, text: cue.text, style: cue.style, ...(cue.pos && { pos: cue.pos }) });
            break;
          }
          case "pic":
            for (const p of out.pics) if (p.to > from) p.to = from;
            if (cue.src) out.pics.push({ from, to: durationInFrames, src: cue.src, pos: cue.pos, size: cue.size, anim: cue.anim });
            break;
          case "stamp":
            out.stamps.push({ from, to: Math.min(durationInFrames, Math.max(nextLine(from), from + sec(1.2))), text: cue.text, pos: cue.pos, ...(speaker && { who: speaker }) });
            break;
          case "fx": {
            const fixed = FX_FRAMES[cue.fx];
            const to = fixed ? Math.min(durationInFrames, from + Math.round(fixed * k)) : nextLine(from);
            out.fx.push({ from, to, fx: cue.fx, ...(speaker && { who: speaker }) });
            break;
          }
          case "se":
            sounds.push({ from, src: resolveSe(cue.se), volume: 0.55 });
            break;
          case "act": {
            const who = cue.who ?? speaker;
            if (!who) throw new Error(`シーン「${scene.heading}」: 誰の動き（${cue.act}）かわかりません。!act 名前 ${cue.act} と書いてください`);
            if (!stage[who]) throw new Error(`シーン「${scene.heading}」: 「${who}」には立ち絵がないので動かせません（characters: に書いてください）`);
            const to = SUSTAINED_ACTS.has(cue.act) ? nextLine(from) : from + Math.round((ACT_FRAMES[cue.act] ?? 16) * k);
            events.push({ from, to, who, kind: "act", act: cue.act });
            if (cue.act === "flip") stage[who].flip = !stage[who].flip;
            break;
          }
          case "enter":
          case "move":
          case "exit":
          case "face": {
            if (!stage[cue.who]) throw new Error(`シーン「${scene.heading}」: 「${cue.who}」には立ち絵がありません（characters: に書いてください）`);
            const slot = stage[cue.who];
            if (cue.kind === "exit") {
              events.push({ from, who: cue.who, kind: "exit" });
              slot.on = false;
            } else if (cue.kind === "face") {
              events.push({ from, who: cue.who, kind: "face", face: cue.face });
              slot.face = cue.face;
            } else {
              const pos = cue.pos ?? slot.pos;
              events.push({ from, who: cue.who, kind: cue.kind, pos });
              slot.on = true;
              slot.pos = pos;
            }
            break;
          }
        }
      }
    };

    sentences.forEach((s, i) => {
      const src = scene.sentences[i];
      if (s.speaker && s.face && stage[s.speaker]) {
        events.push({ from: s.from, who: s.speaker, kind: "face", face: s.face });
        stage[s.speaker].face = s.face;
      }
      apply(src.cues ?? [], s.from, s.speaker);
      lastSpeaker = s.speaker ?? lastSpeaker;
    });
    apply(tailCues, tailAt, lastSpeaker);
    // 同じフレームの出来事は書いた順に（安定ソート）
    events.sort((a, b) => a.from - b.from);
    sounds.sort((a, b) => a.from - b.from);

    scenes.push({
      id: scene.id,
      heading: scene.heading,
      showHeading: false,
      start,
      durationInFrames,
      sentences,
      elements: [],
      skit: out,
      ...(sounds.length && { sounds }),
    });
    start += durationInFrames;
  }
  return { meta: doc.meta, theme, audio: opts.audio ?? {}, durationInFrames: start, scenes, cast, skit: info };
}

/** 背景の指定（色・模様）。画像・動画はパイプラインが bgs に解決して渡す */
export function parseBgSpec(spec: string): ResolvedBg {
  if (/^#[0-9a-f]{3,8}$/i.test(spec)) return { kind: "color", color: spec };
  const patterns = ["sunburst", "dots", "stripes", "gradient", "sky", "speed", "night"] as const;
  if ((patterns as readonly string[]).includes(spec)) return { kind: "pattern", pattern: spec as (typeof patterns)[number] };
  throw new Error(`背景 bg=${spec} がわかりません（#色 / ${patterns.join(" / ")} / 画像・動画のパス）`);
}

export const isMediaPath = (spec: string) => /\.(png|jpe?g|webp|gif|svg|mp4|webm|mov)$/i.test(spec);
export const isVideoPath = (spec: string) => /\.(mp4|webm|mov)$/i.test(spec);
