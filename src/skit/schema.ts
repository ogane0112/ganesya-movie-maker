// ネタ動画・ショート・ゆっくり・アニメ寸劇（layout: skit）の台本の型。
// 舞台（背景）にキャラクターが立ち、台詞に合わせて動き（act）・画面効果（fx）・効果音（se）・テロップ（caption）が入る。
//
// 指示（Cue）は「次の台詞が始まるとき」に起きる。台詞のない所（場面の最後）の指示は、最後の台詞の後に起きる。
import { z } from "zod";

/** キャラクターの動き */
export const ACTS = ["jump", "shake", "nod", "spin", "grow", "shrink", "fall", "tremble", "flip"] as const;
export const Act = z.enum(ACTS);
export type Act = z.infer<typeof Act>;

/** 画面効果 */
export const FXS = ["shake", "flash", "zoom", "lines", "mono"] as const;
export const Fx = z.enum(FXS);
export type Fx = z.infer<typeof Fx>;

/** テロップの見た目 */
export const CAPTION_STYLES = ["impact", "shout", "pop", "note", "title"] as const;
export const CaptionStyle = z.enum(CAPTION_STYLES);

/** テロップ・画像・スタンプを置く所 */
export const Spot = z.enum(["top", "center", "bottom", "left", "right", "tl", "tr", "bl", "br", "auto"]);
export type Spot = z.infer<typeof Spot>;

/** 立ち位置：left / center / right か、画面の左端からの割合（0〜100） */
export const StagePos = z.union([z.enum(["left", "center", "right"]), z.number().min(0).max(100)]);
export type StagePos = z.infer<typeof StagePos>;

export const Cue = z.discriminatedUnion("kind", [
  /** テロップ。次の caption（空なら消す）か場面の終わりまで出す */
  z.object({ kind: z.literal("caption"), text: z.string(), style: CaptionStyle.default("impact"), pos: Spot.optional() }),
  /** 短い飾り文字（！？・草など）。次の台詞まで出す */
  z.object({ kind: z.literal("stamp"), text: z.string(), pos: Spot.default("auto") }),
  /** 画像。次の pic（src なしで消す）か場面の終わりまで出す */
  z.object({
    kind: z.literal("pic"),
    src: z.string().optional(),
    pos: Spot.default("center"),
    /** 置き場所に対する大きさ（0〜1） */
    size: z.number().min(0.1).max(1).default(0.8),
    anim: z.enum(["pop", "slide", "zoom", "fade"]).default("pop"),
  }),
  z.object({ kind: z.literal("enter"), who: z.string(), pos: StagePos.optional() }),
  z.object({ kind: z.literal("exit"), who: z.string() }),
  z.object({ kind: z.literal("move"), who: z.string(), pos: StagePos }),
  /** who を省略すると、その台詞の話者 */
  z.object({ kind: z.literal("act"), who: z.string().optional(), act: Act }),
  z.object({ kind: z.literal("face"), who: z.string(), face: z.string() }),
  z.object({ kind: z.literal("fx"), fx: Fx }),
  /** 組み込みの効果音の名前（gmm se list）か、台本からの相対パス */
  z.object({ kind: z.literal("se"), se: z.string() }),
]);
export type Cue = z.infer<typeof Cue>;

/** 背景：#色 / 組み込みの模様 / 画像・動画のパス */
export const BG_PATTERNS = ["sunburst", "dots", "stripes", "gradient", "sky", "speed", "night"] as const;

/** 場面の入り方 */
export const SkitTransition = z.enum(["cut", "fade", "flash", "slide", "zoom", "wipe"]);
export type SkitTransition = z.infer<typeof SkitTransition>;

/** シーン定義（Scene.skit）：背景・入り方・最後の台詞の後の指示 */
export const SkitSceneDef = z.object({
  bg: z.string().optional(),
  transition: SkitTransition.default("cut"),
  /** 最後の台詞の後に起きる指示（オチの効果音・テロップなど） */
  tail: z.array(Cue).default([]),
  /** 最後の台詞の後の間（秒） */
  tailWait: z.number().min(0).max(10).optional(),
});
export type SkitSceneDef = z.infer<typeof SkitSceneDef>;

// ---- 解決後（フレームはシーン先頭から） ----

export type ResolvedBg =
  | { kind: "color"; color: string }
  | { kind: "pattern"; pattern: (typeof BG_PATTERNS)[number] }
  | { kind: "image"; src: string }
  /** 動画はループして流す（音なし）。seconds は動画の長さ */
  | { kind: "video"; src: string; seconds: number };

/** 舞台の上の1人の状態 */
export type StageSlot = { on: boolean; pos: StagePos; face?: string; flip: boolean };

export type StageEvent =
  | { from: number; who: string; kind: "enter" | "move"; pos: StagePos }
  | { from: number; who: string; kind: "exit" }
  | { from: number; who: string; kind: "face"; face: string }
  /** to: 続く動き（shrink・fall・tremble など）を終えるフレーム */
  | { from: number; to: number; who: string; kind: "act"; act: Act };

export type SkitResolvedScene = {
  bg: ResolvedBg;
  transition: SkitTransition;
  /** シーンが始まる時点の舞台（前のシーンから引き継ぐ） */
  stage0: Record<string, StageSlot>;
  events: StageEvent[];
  captions: { from: number; to: number; text: string; style: z.infer<typeof CaptionStyle>; pos?: Spot }[];
  stamps: { from: number; to: number; text: string; pos: Spot; who?: string }[];
  pics: { from: number; to: number; src: string; pos: Spot; size: number; anim: "pop" | "slide" | "zoom" | "fade" }[];
  /** who: zoom で寄る相手（その時の話者） */
  fx: { from: number; to: number; fx: Fx; who?: string }[];
};

/** 動画全体の skit の情報 */
export type SkitInfo = {
  format: "wide" | "short" | "square";
  style: "yukkuri" | "anime" | "meme";
  subtitleStyle: "yukkuri" | "bubble" | "bold" | "box" | "none";
  banner?: string;
};
