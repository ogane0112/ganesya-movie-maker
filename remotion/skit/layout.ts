// ネタ動画（layout: skit）の画面の割り付け。画面の形（横長・縦長・正方形）と見た目の型（style）で決まる。
import type { ResolvedCharacter, Timeline } from "../../src/schema";
import type { SkitInfo, Spot, StagePos } from "../../src/skit/schema";

export type Box = { x: number; y: number; width: number; height: number };

/** 立ち絵の画面上の高さ（px） */
const CHAR_HEIGHT: Record<SkitInfo["format"], Record<SkitInfo["style"], number>> = {
  wide: { yukkuri: 330, anime: 500, meme: 500 },
  short: { yukkuri: 420, anime: 760, meme: 680 },
  square: { yukkuri: 300, anime: 460, meme: 440 },
};

/** left / right の立ち位置（画面の幅に対する割合） */
const SIDE_X: Record<SkitInfo["format"], Record<SkitInfo["style"], [number, number]>> = {
  wide: { yukkuri: [0.11, 0.89], anime: [0.2, 0.8], meme: [0.2, 0.8] },
  short: { yukkuri: [0.24, 0.76], anime: [0.27, 0.73], meme: [0.27, 0.73] },
  square: { yukkuri: [0.18, 0.82], anime: [0.24, 0.76], meme: [0.24, 0.76] },
};

export type SkitLayout = {
  W: number;
  H: number;
  portrait: boolean;
  charHeight: number;
  banner?: Box;
  /** テロップ・画像を置く所 */
  content: Box;
  /** 字幕の枠（吹き出しでないとき）。bottom は画面下端からの距離 */
  subtitle: { x: number; width: number; bottom: number; fontSize: number; lineHeight: number };
};

export function skitLayout(t: Timeline): SkitLayout {
  const info = t.skit!;
  const { width: W, height: H } = t.meta;
  const portrait = info.format !== "wide";
  const charHeight = CHAR_HEIGHT[info.format][info.style];
  const banner = info.banner ? { x: 0, y: 0, width: W, height: info.format === "short" ? 230 : 120 } : undefined;
  const sub = info.subtitleStyle;
  const fontSize = sub === "bold" ? (portrait ? 68 : 64) : sub === "yukkuri" ? (portrait ? 60 : 54) : portrait ? 54 : 50;
  const lineHeight = Math.round(fontSize * 1.3);
  // 横長：字幕は下端。ゆっくりは左右の隅の話者の間。縦長・正方形：字幕は話者の頭の上
  const subtitle = portrait
    ? { x: 48, width: W - 96, bottom: Math.round(charHeight * (info.style === "yukkuri" ? 0.92 : 0.97)) + 16, fontSize, lineHeight }
    : info.style === "yukkuri"
      ? { x: Math.round(W * 0.21), width: Math.round(W * 0.58), bottom: 28, fontSize, lineHeight }
      : { x: Math.round(W * 0.1), width: Math.round(W * 0.8), bottom: 36, fontSize, lineHeight };
  const subTop = H - subtitle.bottom - (lineHeight * 2 + 24);
  const top = (banner ? banner.height : 0) + (portrait ? 40 : 56);
  // 吹き出しのときは、話者の頭の上（吹き出しの来る所）より上を使う
  const bottom = sub === "bubble" ? H - charHeight - 230 : sub === "none" ? H - Math.round(charHeight * 0.6) : subTop - 24;
  const x = portrait ? 48 : Math.round(W * 0.2);
  const content = { x, y: top, width: W - 2 * x, height: Math.max(120, bottom - top) };
  return { W, H, portrait, charHeight, banner, content, subtitle };
}

/** 立ち位置 → 画面上の x（立ち絵の中心） */
export function stageX(t: Timeline, pos: StagePos): number {
  const info = t.skit!;
  const W = t.meta.width;
  if (typeof pos === "number") return (pos / 100) * W;
  const [l, r] = SIDE_X[info.format][info.style];
  return (pos === "left" ? l : pos === "right" ? r : 0.5) * W;
}

/** 立ち絵の画面上の大きさ */
export function figureSize(ch: ResolvedCharacter, charHeight: number) {
  return { width: Math.round((charHeight * ch.width) / ch.height), height: charHeight };
}

/** テロップ・画像の置き場所 → 枠 */
export function spotBox(content: Box, spot: Spot | undefined): Box {
  const { x, y, width: w, height: h } = content;
  const hw = w / 2;
  const hh = h / 2;
  switch (spot) {
    case "top":
      return { x, y, width: w, height: hh };
    case "bottom":
      return { x, y: y + hh, width: w, height: hh };
    case "left":
      return { x, y, width: hw, height: h };
    case "right":
      return { x: x + hw, y, width: hw, height: h };
    case "tl":
      return { x, y, width: hw, height: hh };
    case "tr":
      return { x: x + hw, y, width: hw, height: hh };
    case "bl":
      return { x, y: y + hh, width: hw, height: hh };
    case "br":
      return { x: x + hw, y: y + hh, width: hw, height: hh };
    default:
      return content;
  }
}
