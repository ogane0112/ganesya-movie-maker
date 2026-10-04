// モーション動画（layout: motion）の部品。解説動画の部品（src/schema.ts の Element）とは別に、Scene.motion に入る。
// どの部品も画面全体を使う「層」で、後に書いた部品ほど上に重なる。
//
// 出すタイミング：at（n 番目のナレーション文）か beat（場面の n 拍目。1 拍目が場面の頭）。どちらもなければ場面の頭。
import { z } from "zod";

const At = z.number().int().min(1);
const Beat = z.number().min(1);
/**
 * 部品を置く場所。full（画面全体・既定）/ left・right（左右の半分）/ top・bottom（上下の半分）/
 * tl・tr・bl・br（四隅の4分の1）/ center（中央の大きめの枠）
 */
export const Area = z.enum(["full", "left", "right", "top", "bottom", "tl", "tr", "bl", "br", "center"]);
export type Area = z.infer<typeof Area>;
const When = { at: At.optional(), beat: Beat.optional(), area: Area.optional() };

/** 大きな文字が拍に合わせて出る（キネティック・タイポグラフィ） */
export const KineticElement = z.object({
  type: z.literal("kinetic"),
  /** 行ごとに出る。**語** はアクセントの色。行に時刻がなければ every 拍ごとに次の行 */
  lines: z.array(z.object({ text: z.string(), ...When })).min(1),
  /** pop: 弾んで出る / slide: 下から / type: 1文字ずつ / blur: ぼかしから */
  style: z.enum(["pop", "slide", "type", "blur"]).default("pop"),
  /** replace: 前の行と入れ替わる / stack: 積み重なる */
  mode: z.enum(["replace", "stack"]).default("replace"),
  every: z.number().positive().default(1),
  /** 文字の大きさ（px）。省略時は行の長さから決める */
  size: z.number().optional(),
  ...When,
});

/** 数字が数え上がる */
export const CounterElement = z.object({
  type: z.literal("counter"),
  value: z.number(),
  /** 数え始めの数（台本では from=） */
  start: z.number().default(0),
  prefix: z.string().default(""),
  suffix: z.string().default(""),
  label: z.string().optional(),
  decimals: z.number().int().min(0).default(0),
  /** 数え上がるのにかける拍数 */
  beats: z.number().positive().default(4),
  ...When,
});

/** 棒グラフ・折れ線グラフが伸びる */
export const ChartElement = z.object({
  type: z.literal("chart"),
  kind: z.enum(["bar", "line"]).default("bar"),
  title: z.string().optional(),
  unit: z.string().default(""),
  items: z.array(z.object({ label: z.string(), value: z.number(), highlight: z.boolean().default(false) })).min(1),
  beats: z.number().positive().default(4),
  ...When,
});

/** 年表。項目が順に出て、目印が横に進む */
export const HistoryElement = z.object({
  type: z.literal("history"),
  items: z.array(z.object({ label: z.string(), text: z.string(), ...When })).min(1),
  every: z.number().positive().default(2),
  ...When,
});

/** 大きな題名（ロゴ・題名の見せ場） */
export const HeroElement = z.object({
  type: z.literal("hero"),
  title: z.string(),
  subtitle: z.string().optional(),
  /** reveal: 線が走って文字が現れる / zoom: 奥から迫る / split: 上下に割れて出る */
  style: z.enum(["reveal", "zoom", "split"]).default("reveal"),
  ...When,
});

/** 動く背景（拍に合わせて脈打つ） */
export const BackdropElement = z.object({
  type: z.literal("backdrop"),
  style: z.enum(["gradient", "grid", "particles", "rays", "stars"]).default("gradient"),
  ...When,
});

/** 画面写真・画像を、端末の枠に入れて見せる */
export const ShotElement = z.object({
  type: z.literal("shot"),
  src: z.string(),
  caption: z.string().optional(),
  frame: z.enum(["browser", "phone", "none"]).default("browser"),
  /** ゆっくり寄る（1 で寄らない） */
  zoom: z.number().min(1).default(1.08),
  ...When,
});

/** 組み込みの 3D の場面 */
export const ThreeElement = z.object({
  type: z.literal("three"),
  preset: z.enum(["cubes", "globe", "particles", "rings"]).default("cubes"),
  ...When,
});

/** AI（や人）が書いた場面のコード（TSX）。src は台本からの相対パス。props は部品に渡す値 */
export const CustomElement = z.object({
  type: z.literal("custom"),
  src: z.string(),
  props: z.record(z.string(), z.string()).default({}),
  ...When,
});

/** ターミナル。$ で始まる行は打ち込まれ、それ以外の行（出力）はそのまま出る */
export const TerminalElement = z.object({
  type: z.literal("terminal"),
  title: z.string().default("Terminal"),
  lines: z.array(z.object({ text: z.string(), ...When })).min(1),
  every: z.number().positive().default(1),
  ...When,
});

/** エディタ。台本やコードが打ち込まれていく（typing=false なら最初から全部） */
export const EditorElement = z.object({
  type: z.literal("editor"),
  file: z.string().default("script.md"),
  lang: z.enum(["markdown", "ts", "text"]).default("markdown"),
  code: z.string().default(""),
  /** 手元のファイルを見せる（台本からの相対パス。パイプラインで code に読み込む）。lines="1-12" で行を絞る */
  src: z.string().optional(),
  lines: z.string().optional(),
  typing: z.boolean().default(true),
  /** 打ち終わるまでの拍数 */
  beats: z.number().positive().default(4),
  ...When,
});

/** 動画の一部を端末の枠に入れて流す（書き出した動画を見せる）。start / end は元の動画の秒 */
export const ClipElement = z.object({
  type: z.literal("clip"),
  src: z.string(),
  start: z.number().min(0).default(0),
  end: z.number().optional(),
  frame: z.enum(["browser", "phone", "none"]).default("browser"),
  caption: z.string().optional(),
  ...When,
});

/** できることの一覧（カードが順に出る） */
export const FeaturesElement = z.object({
  type: z.literal("features"),
  items: z.array(z.object({ title: z.string(), text: z.string().default(""), ...When })).min(1),
  every: z.number().positive().default(1),
  columns: z.number().int().min(1).max(4).optional(),
  ...When,
});

/** 手順の見出し（STEP 1 / 3・大きな題・短い説明・進み具合） */
export const StepElement = z.object({
  type: z.literal("step"),
  n: z.number().int().min(1),
  of: z.number().int().min(1).optional(),
  title: z.string(),
  text: z.string().optional(),
  ...When,
});

export const MotionElement = z.discriminatedUnion("type", [
  StepElement,
  TerminalElement,
  EditorElement,
  ClipElement,
  FeaturesElement,
  KineticElement,
  CounterElement,
  ChartElement,
  HistoryElement,
  HeroElement,
  BackdropElement,
  ShotElement,
  ThreeElement,
  CustomElement,
]);
export type MotionElement = z.infer<typeof MotionElement>;

/** 場面の入り方 */
export const Transition = z.enum(["cut", "fade", "wipe", "zoom", "slide", "flash", "glitch"]);
export type Transition = z.infer<typeof Transition>;

// ---- 解決後（フレームが決まったもの） ----

type Timed<T> = Omit<T, "at" | "beat"> & { from: number };
// 行・項目の area は使わない（部品ごと）

export type ResolvedMotionElement =
  | (Timed<Omit<z.infer<typeof KineticElement>, "lines">> & { lines: { text: string; from: number }[] })
  | Timed<z.infer<typeof CounterElement>>
  | Timed<z.infer<typeof ChartElement>>
  | (Timed<Omit<z.infer<typeof HistoryElement>, "items">> & { items: { label: string; text: string; from: number }[] })
  | Timed<z.infer<typeof HeroElement>>
  | Timed<z.infer<typeof BackdropElement>>
  | Timed<z.infer<typeof ShotElement>>
  | Timed<z.infer<typeof ThreeElement>>
  | (Timed<Omit<z.infer<typeof TerminalElement>, "lines">> & { lines: { text: string; from: number }[] })
  | Timed<z.infer<typeof EditorElement>>
  | Timed<z.infer<typeof ClipElement>>
  | Timed<z.infer<typeof StepElement>>
  | (Timed<Omit<z.infer<typeof FeaturesElement>, "items">> & { items: { title: string; text: string; from: number }[] })
  /** id: 場面コードの登録名（remotion/.generated/custom.ts） */
  | (Timed<z.infer<typeof CustomElement>> & { id: string });

/** 動画全体の拍の情報 */
export type MotionInfo = { bpm: number; framesPerBeat: number };
