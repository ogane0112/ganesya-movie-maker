// 画面の割り付け。動画（Video.tsx）と検査（rules.ts）の両方で同じ計算を使う。
import type { Timeline } from "../src/schema";

/** 立ち絵の右端からの余白（px） */
export const CHARACTER_MARGIN = 40;
/** 字幕帯の下端からの余白・字幕の最大行数 */
export const SUBTITLE_BOTTOM = 36;
export const SUBTITLE_MAX_LINES = 2;
const SUBTITLE_LINE_HEIGHT = 1.35;

export type Box = { x: number; y: number; width: number; height: number };

export type Layout = {
  /** 部品の配置領域の右側を、立ち絵のためにどれだけ空けるか（px, padding の内側） */
  reserveRight: number;
  /** 部品の配置領域の下側を、字幕のためにどれだけ空けるか（px, padding の内側） */
  reserveBottom: number;
  /** 焼き込み字幕の枠（なければ undefined） */
  subtitle?: Box & { lineHeight: number };
};

export function computeLayout(t: Timeline): Layout {
  const { theme } = t;
  const { width, height } = t.meta;
  const ch = t.character;
  // 立ち絵の左端より 32px 内側までを部品に使う
  const characterLeft = ch ? width - CHARACTER_MARGIN - ch.width : width;
  const reserveRight = ch ? Math.max(0, width - characterLeft + 32 - theme.padding) : 0;

  if (t.meta.subtitles !== "burn") return { reserveRight, reserveBottom: 0 };
  const lineHeight = Math.round(theme.subtitle.fontSize * SUBTITLE_LINE_HEIGHT);
  const boxHeight = lineHeight * SUBTITLE_MAX_LINES + 24;
  const x = theme.padding / 2;
  const right = ch ? characterLeft - 16 : width - theme.padding / 2;
  const subtitle = { x, y: height - SUBTITLE_BOTTOM - boxHeight, width: right - x, height: boxHeight, lineHeight };
  // 部品の下端が字幕帯の 24px 上に来るようにする
  const reserveBottom = Math.max(0, height - subtitle.y + 24 - theme.padding);
  return { reserveRight, reserveBottom, subtitle };
}
