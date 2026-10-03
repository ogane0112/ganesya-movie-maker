// シーン定義JSON（scenes.json）とタイムラインJSON（timeline.json）の仕様。
// 台本パーサの出力であり、AIが直接書いてもよい公開フォーマット。
import { z } from "zod";
import type { Theme } from "../remotion/theme";

/** 「n番目のナレーション文が始まるときに出す」の n（1始まり）。省略時はシーン冒頭。 */
const At = z.number().int().min(1);

export const TitleElement = z.object({
  type: z.literal("title"),
  title: z.string(),
  subtitle: z.string().optional(),
  at: At.optional(),
});

export const BulletsElement = z.object({
  type: z.literal("bullets"),
  items: z.array(
    z.object({
      text: z.string(),
      at: At.optional(),
      /** n番目の文で強調マーカーを付ける */
      emphasisAt: At.optional(),
    }),
  ),
});

export const CodeElement = z.object({
  type: z.literal("code"),
  lang: z.string().default("text"),
  code: z.string(),
  at: At.optional(),
  /** n番目の文が始まったら lines（1始まり）をハイライトする */
  highlights: z.array(z.object({ at: At, lines: z.array(z.number().int().min(1)) })).default([]),
});

export const TextElement = z.object({
  type: z.literal("text"),
  text: z.string(),
  /** plain: 本文 / callout: 枠付きの要点 */
  variant: z.enum(["plain", "callout"]).default("plain"),
  at: At.optional(),
});

export const MathElement = z.object({
  type: z.literal("math"),
  /** TeX（KaTeX で描く） */
  tex: z.string(),
  at: At.optional(),
});

export const ImageElement = z.object({
  type: z.literal("image"),
  /** 台本からの相対パス（パイプラインで public/ にコピーされる） */
  src: z.string(),
  caption: z.string().optional(),
  at: At.optional(),
});

const Arrow = z.enum(["->", "<-", "<->", "--"]);

export const DiagramElement = z.object({
  type: z.literal("diagram"),
  /** LR: 横に並べる / TB: 縦に並べる */
  direction: z.enum(["LR", "TB"]).default("LR"),
  nodes: z.array(z.object({ text: z.string(), at: At.optional(), emphasisAt: At.optional() })).min(1),
  /** edges[i] は nodes[i] と nodes[i+1] の間の矢印（なければ null） */
  edges: z.array(z.object({ arrow: Arrow, label: z.string().optional(), at: At.optional() }).nullable()),
});

export const Element = z.discriminatedUnion("type", [
  TitleElement,
  BulletsElement,
  CodeElement,
  TextElement,
  MathElement,
  ImageElement,
  DiagramElement,
]);

export const Scene = z.object({
  id: z.string(),
  heading: z.string(),
  /** 見出しバーを出すか。title 部品だけのシーンでは false にする */
  showHeading: z.boolean().default(true),
  sentences: z.array(
    z.object({
      /** 字幕・画面に出す表記 */
      text: z.string(),
      /** 読み上げる文（表記と違うときだけ） */
      speech: z.string().optional(),
      /** 立ち絵の表情。この文から切り替わり、次の指定まで続く */
      face: z.string().optional(),
    }),
  ),
  elements: z.array(Element),
});

export const Meta = z.object({
  title: z.string().default("untitled"),
  /** 組み込みテーマ名（wakaba / dark）かテーマJSONのパス */
  theme: z.string().default("wakaba"),
  voice: z.string().default("zundamon"),
  /** 立ち絵。none / builtin / characters/<名前>/ の画像セット / ディレクトリのパス */
  character: z.string().default("none"),
  /** 字幕。burn: 焼き込み＋SRT / srt: SRT だけ / none: なし */
  subtitles: z.enum(["burn", "srt", "none"]).default("burn"),
  /** 読みの辞書（表記 → よみ）。全文の読み上げに適用する */
  readings: z.record(z.string(), z.string()).default({}),
  /** BGM（台本からの相対パス）。ナレーション中は自動で音量を下げる */
  bgm: z.string().optional(),
  /** BGM の音量（ナレーションがないとき, 0〜1） */
  bgmVolume: z.number().min(0).max(1).default(0.2),
  /** BGM のクレジット表記（credits.txt に書く） */
  bgmCredit: z.string().optional(),
  /** 場面転換の効果音。default（組み込み）/ none / 音声ファイルのパス */
  se: z.string().default("default"),
  /** 読み上げ速度（VOICEVOX の speedScale） */
  speed: z.number().default(1.0),
  fps: z.number().int().default(30),
  width: z.number().int().default(1920),
  height: z.number().int().default(1080),
});

export const SceneDoc = z.object({
  version: z.literal(1).default(1),
  meta: Meta,
  scenes: z.array(Scene),
});

export type TitleElement = z.infer<typeof TitleElement>;
export type BulletsElement = z.infer<typeof BulletsElement>;
export type CodeElement = z.infer<typeof CodeElement>;
export type TextElement = z.infer<typeof TextElement>;
export type MathElement = z.infer<typeof MathElement>;
export type ImageElement = z.infer<typeof ImageElement>;
export type DiagramElement = z.infer<typeof DiagramElement>;
export type Element = z.infer<typeof Element>;
export type Scene = z.infer<typeof Scene>;
export type Meta = z.infer<typeof Meta>;
export type SceneDoc = z.infer<typeof SceneDoc>;

// ---- 音声合成の結果（audio-timing.json） ----

export type SentenceAudio = {
  sceneId: string;
  index: number;
  text: string;
  /** 出力ディレクトリの public/ からの相対パス（Remotion の staticFile で読む） */
  file: string;
  seconds: number;
  /** 口を開けている区間（秒）。立ち絵の口パクに使う */
  mouth: [number, number][];
};

export type AudioTiming = {
  provider: string;
  voice: string;
  /** クレジット表記（例: VOICEVOX:ずんだもん） */
  credit?: string;
  sentences: SentenceAudio[];
};

// ---- レンダリング用に解決済みのタイムライン（timeline.json） ----
// フレーム番号はすべてシーン先頭からの相対値。

export type CodeToken = { content: string; color?: string };

export type ResolvedElement =
  | (Omit<TitleElement, "at"> & { from: number })
  /** html: 本文中の $…$ を KaTeX で描いた HTML（文字はエスケープ済み） */
  | (Omit<TextElement, "at"> & { from: number; html: string })
  | (Omit<ImageElement, "at"> & { from: number })
  | { type: "math"; from: number; tex: string; html: string }
  | {
      type: "bullets";
      from: number;
      items: { text: string; html: string; from: number; emphasisFrom?: number }[];
    }
  | {
      type: "diagram";
      from: number;
      direction: "LR" | "TB";
      nodes: { text: string; from: number; emphasisFrom?: number }[];
      edges: ({ arrow: "->" | "<-" | "<->" | "--"; label?: string; from: number } | null)[];
    }
  | {
      type: "code";
      from: number;
      lang: string;
      code: string;
      /** Shiki で事前に色付けした行ごとのトークン */
      lines: CodeToken[][];
      background: string;
      highlights: { from: number; lines: number[] }[];
    };

export type ResolvedSentence = {
  text: string;
  from: number;
  durationInFrames: number;
  audio?: string;
  /** この文を話している間の表情（前の文から引き継いだものを含む） */
  face?: string;
  /** 口を開けている区間（シーン先頭からのフレーム） */
  mouth: [number, number][];
};

export type ResolvedScene = {
  id: string;
  heading: string;
  showHeading: boolean;
  /** 動画全体での開始フレーム */
  start: number;
  durationInFrames: number;
  sentences: ResolvedSentence[];
  elements: ResolvedElement[];
};

/** 立ち絵の1レイヤー。src は出力ディレクトリの public/ からの相対パス */
export type CharacterLayer = { src: string; blend: string; opacity: number };

/** 表情ごと・状態ごとに表示するレイヤー（layers の添字、下から上の順） */
export type CharacterStates = { closed: number[]; open: number[]; blink: number[]; blinkOpen: number[] };

export type ResolvedCharacter = {
  name: string;
  credit?: string;
  /** 画面上の表示サイズ（px）。部品はこの幅を避けて配置される */
  width: number;
  height: number;
  defaultFace: string;
} & (
  | { kind: "builtin" }
  | {
      kind: "layers";
      /** 元画像（PSD）のキャンバスサイズと、そのうち表示する範囲 */
      canvas: { width: number; height: number };
      crop: { x: number; y: number; width: number; height: number };
      layers: CharacterLayer[];
      expressions: Record<string, CharacterStates>;
    }
);

export type TimelineAudio = {
  /** volume: ナレーションがないときの音量 / duck: ナレーション中にかける倍率 */
  bgm?: { src: string; volume: number; duck: number };
  se?: { src: string; volume: number };
};

export type Timeline = {
  meta: Meta;
  theme: Theme;
  audio: TimelineAudio;
  durationInFrames: number;
  scenes: ResolvedScene[];
  character?: ResolvedCharacter;
};
