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

/** 用語カード。glossary の用語と説明を画面に出す。出す文（{n}）でその用語を説明したことになる */
export const TermElement = z.object({
  type: z.literal("term"),
  term: z.string(),
  /** 省略時は glossary の説明 */
  description: z.string().optional(),
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
  TermElement,
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
      /** この文で説明している用語（glossary の用語） */
      explains: z.array(z.string()).optional(),
      /** 話者（speakers の名前）。省略時は既定の声 */
      speaker: z.string().optional(),
      /** ゲーム実況: この発言を始めたい録画の時刻（秒） */
      at: z.number().optional(),
    }),
  ),
  /** ゲーム実況: この区間（スプリット）が始まる録画の時刻（秒）。区間でないシーン（計測前）は省略 */
  splitAt: z.number().optional(),
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
  /** 専門用語の一覧（用語 → 一言の説明）。動画のどこかで必ず説明されているかを検査する */
  glossary: z.record(z.string(), z.string()).default({}),
  /** 読みの辞書（表記 → よみ）。全文の読み上げに適用する */
  readings: z.record(z.string(), z.string()).default({}),
  /** BGM。カタログの曲（maou:acoustic50。gmm bgm list で一覧）か、台本からの相対パス */
  bgm: z.string().optional(),
  /** BGM の音量（ナレーションがないとき）。曲の音の大きさはナレーションにそろえてあり、1.0 で同じ大きさ */
  bgmVolume: z.number().min(0).max(1).default(0.3),
  /** BGM のクレジット表記（credits.txt に書く）。カタログの曲なら自動 */
  bgmCredit: z.string().optional(),
  /** 場面転換の効果音。default（組み込み）/ none / 音声ファイルのパス */
  se: z.string().default("default"),
  /** 読み上げ速度（VOICEVOX の speedScale） */
  speed: z.number().default(1.0),
  /** 画面構成。explainer: 解説動画 / biim: ゲーム実況（biim システム） */
  layout: z.enum(["explainer", "biim"]).default("explainer"),
  /** 話者の名前 → VOICEVOX の声（掛け合い用。台本では「名前: 発言」と書く） */
  speakers: z.record(z.string(), z.string()).default({}),
  /** 話者の名前 → 立ち絵（builtin / builtin-metan / characters/<名前>/） */
  characters: z.record(z.string(), z.string()).default({}),
  /** ゲーム実況: 録画ファイル（台本からの相対パス） */
  video: z.string().optional(),
  /** ゲーム実況: 録画内で計測を始めた時刻・終えた時刻（"1:23.45" か秒） */
  runStart: z.union([z.string(), z.number()]).optional(),
  runEnd: z.union([z.string(), z.number()]).optional(),
  /** ゲーム実況: レギュレーション（Any% など） */
  category: z.string().optional(),
  /**
   * ゲーム実況: 画面の作り。
   * overlay: ゲームを全面に出し、左下と右下に話者が向かい合って乗る / stage: 上にゲーム、下で話者が向かい合う /
   * classic: 定番の biim 枠（右上・右・下の箱と左下の円）/ simple: 箱を並べただけ
   */
  biimFrame: z.enum(["overlay", "stage", "classic", "simple"]).default("overlay"),
  /** ゲーム実況: 枠の画像（1920×1080 の PNG。ゲームの所を透明にしたもの）。classic の配置のまま、線の代わりに重ねる */
  frameImage: z.string().optional(),
  /** ゲーム実況: ゲーム音の大きさ（実況がないとき）。実況中は自動で下げる */
  gameVolume: z.number().min(0).max(1).default(0.5),
  fps: z.number().int().default(30),
  width: z.number().int().default(1920),
  height: z.number().int().default(1080),
});

/** ゲーム実況の編集。cut: 区間を切る（ロードなど）/ fast: rate 倍速にする。時刻は録画の秒 */
export const Edit = z.object({
  type: z.enum(["cut", "fast"]),
  from: z.number(),
  to: z.number(),
  rate: z.number().positive().default(1),
});
export type Edit = z.infer<typeof Edit>;

export const SceneDoc = z.object({
  version: z.literal(1).default(1),
  edits: z.array(Edit).default([]),
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
export type TermElement = z.infer<typeof TermElement>;
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
  | { type: "term"; from: number; term: string; description: string }
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
  /** この文で説明している用語（{term:…} と、この文で出る用語カード） */
  explains?: string[];
  /** この文を話している間の表情（前の文から引き継いだものを含む） */
  face?: string;
  /** 口を開けている区間（シーン先頭からのフレーム） */
  mouth: [number, number][];
  speaker?: string;
  /** ゲーム実況: 前のシーンから続いている発言（このシーンでは字幕だけ出し、声は前のシーンで鳴っている） */
  carry?: boolean;
  /** ゲーム実況: 台本で指定した開始（シーン先頭からのフレーム）。実際の開始との差が「遅れ」 */
  anchor?: number;
};

/** ゲーム実況: 出力の [from, from+durationInFrames) に、録画の videoFrom 秒から rate 倍速で流す */
export type FootageSegment = { from: number; durationInFrames: number; videoFrom: number; rate: number };

export type ResolvedScene = {
  id: string;
  /** ゲーム実況: 動画全体での開始フレーム（シーン単位の書き出しでも変わらない。タイマーの計算に使う） */
  globalStart?: number;
  /** ゲーム実況: このシーンで流す録画の区間（フレームはシーン先頭から） */
  footage?: FootageSegment[];
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
  /** variant: 色違い（BUILTIN_PALETTES のキー） */
  | { kind: "builtin"; variant?: string }
  | {
      kind: "layers";
      /** 元画像（PSD）のキャンバスサイズと、そのうち表示する範囲 */
      canvas: { width: number; height: number };
      crop: { x: number; y: number; width: number; height: number };
      /** 顔の中心（元画像の px） */
      face?: { x: number; y: number };
      /** 立ち絵の向き */
      facing?: "left" | "right" | "front";
      /** その人の色 */
      color?: string;
      layers: CharacterLayer[];
      expressions: Record<string, CharacterStates>;
    }
);

export type TimelineAudio = {
  /** volume: ナレーションがないときの音量 / duck: ナレーション中にかける倍率 */
  bgm?: {
    src: string;
    volume: number;
    duck: number;
    /** 元の曲の音の大きさ（LUFS）。volume はこれをナレーションにそろえたうえでの値 */
    lufs?: number;
    credit?: string;
  };
  se?: { src: string; volume: number };
};

export type Timeline = {
  meta: Meta;
  theme: Theme;
  audio: TimelineAudio;
  durationInFrames: number;
  scenes: ResolvedScene[];
  character?: ResolvedCharacter;
  /** シーン単位で書き出すとき（F10）だけ付く。何番目のシーンか、そのシーン開始時の表情 */
  segment?: { index: number; initialFace?: string; initialFaces?: Record<string, string> };
  /** 掛け合いの話者（声・立ち絵・字幕の色） */
  cast?: CastMember[];
  /** ゲーム実況の情報 */
  run?: RunInfo;
};

export type CastMember = { name: string; color: string; character?: ResolvedCharacter };

export type RunInfo = {
  /** 録画（public/ からの相対パス）と大きさ */
  video: string;
  width: number;
  height: number;
  category?: string;
  /** 録画内の計測開始・終了（秒） */
  runStart: number;
  runEnd: number;
  /** 区間の名前と、その区間を終えた時点の計測タイム（秒） */
  splits: { name: string; endRunTime: number }[];
  /** 動画全体での録画の流し方（タイマーの計算に使う） */
  footage: FootageSegment[];
  /** ゲーム音（実況がないときの大きさ） */
  gameVolume: number;
  frame: "overlay" | "stage" | "classic" | "simple";
  /** 枠の画像（public/ からの相対パス） */
  frameImage?: string;
};
