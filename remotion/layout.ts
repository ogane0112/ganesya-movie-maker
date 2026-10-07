// 画面の割り付け。動画（Video.tsx）と検査（rules.ts）の両方で同じ計算を使う。
import type { ResolvedCharacter, Timeline } from "../src/schema";

/** 立ち絵の右端からの余白（px） */
export const CHARACTER_MARGIN = 40;
/** 字幕帯の下端からの余白・字幕の最大行数 */
export const SUBTITLE_BOTTOM = 36;
export const SUBTITLE_MAX_LINES = 2;
const SUBTITLE_LINE_HEIGHT = 1.35;

export type Box = { x: number; y: number; width: number; height: number };

/** 掛け合いの立ち絵：画面上の高さと、画面の端からの位置（負なら少し画面の外に出す） */
export const DUO_CHARACTER = { height: 520, inset: -30 };

export type Layout = {
  /** 部品の配置領域の右側を、立ち絵のためにどれだけ空けるか（px, padding の内側） */
  reserveRight: number;
  /** 同じく左側（掛け合いで左にも立ち絵がいるとき） */
  reserveLeft: number;
  /** 部品の配置領域の下側を、字幕のためにどれだけ空けるか（px, padding の内側） */
  reserveBottom: number;
  /** 焼き込み字幕の枠（なければ undefined） */
  subtitle?: Box & { lineHeight: number };
};

/** 掛け合い（解説動画で speakers: に2人以上・立ち絵あり）の左右の立ち絵。1人目が左、2人目が右 */
export function duoCharacters(t: Timeline): { left: ResolvedCharacter; right: ResolvedCharacter } | undefined {
  if (t.run || t.skit) return undefined;
  const chars = (t.cast ?? []).map((c) => c.character).filter((c): c is ResolvedCharacter => !!c);
  return chars.length >= 2 ? { left: chars[0], right: chars[1] } : undefined;
}

/** 掛け合いの立ち絵の画面上の幅 */
export const duoWidth = (ch: ResolvedCharacter) => Math.round((ch.width * DUO_CHARACTER.height) / ch.height);

export function computeLayout(t: Timeline): Layout {
  const { theme } = t;
  const { width, height } = t.meta;
  const ch = t.character;
  const duo = duoCharacters(t);
  // 立ち絵の左端より 32px 内側までを部品に使う
  const characterLeft = duo ? width - DUO_CHARACTER.inset - duoWidth(duo.right) : ch ? width - CHARACTER_MARGIN - ch.width : width;
  const characterRight = duo ? DUO_CHARACTER.inset + duoWidth(duo.left) : 0;
  const reserveRight = duo || ch ? Math.max(0, width - characterLeft + 32 - theme.padding) : 0;
  const reserveLeft = duo ? Math.max(0, characterRight + 32 - theme.padding) : 0;

  if (t.meta.subtitles !== "burn") return { reserveRight, reserveLeft, reserveBottom: 0 };
  const lineHeight = Math.round(theme.subtitle.fontSize * SUBTITLE_LINE_HEIGHT);
  const boxHeight = lineHeight * SUBTITLE_MAX_LINES + 24;
  const x = duo ? characterRight + 16 : theme.padding / 2;
  const right = duo || ch ? characterLeft - 16 : width - theme.padding / 2;
  const subtitle = { x, y: height - SUBTITLE_BOTTOM - boxHeight, width: right - x, height: boxHeight, lineHeight };
  // 部品の下端が字幕帯の 24px 上に来るようにする
  const reserveBottom = Math.max(0, height - subtitle.y + 24 - theme.padding);
  return { reserveRight, reserveLeft, reserveBottom, subtitle };
}
