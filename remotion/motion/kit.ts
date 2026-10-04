// モーション動画の部品と、AI が書く場面のコード（:::custom）で使う道具。
// 場面のコードからは `import { … } from "gmm-motion"` で読める。
//
// 決まり：Math.random() と Date は使わない（同じ台本なら同じ動画になること）。乱数は random(seed) を使う。
import { Easing, interpolate, spring } from "remotion";
import type { Theme } from "../theme";

/** 場面のコード（:::custom）が受け取るもの */
export type MotionSceneProps = {
  /** 部品が出てからのフレーム（0 始まり）。useCurrentFrame() と同じ */
  frame: number;
  fps: number;
  /** 画面の大きさ */
  width: number;
  height: number;
  /** 部品が出てから場面の終わりまでのフレーム数 */
  durationInFrames: number;
  /** 拍の情報 */
  beat: BeatInfo;
  /** 色とフォント */
  palette: Palette;
  /** 台本の :::custom に書いた key=value */
  props: Record<string, string>;
};

export type BeatInfo = {
  framesPerBeat: number;
  /** 部品が出てから何拍目か（0 始まり・小数） */
  index: number;
  /** 拍の頭で 1、次の拍に向けて 0 に落ちる（脈打つ動きに使う） */
  pulse: number;
};

export type Palette = {
  background: string;
  surface: string;
  text: string;
  subtext: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  fontFamily: string;
  displayFontFamily: string;
  monoFontFamily: string;
};

export function paletteOf(theme: Theme): Palette {
  return {
    background: theme.background,
    surface: theme.surface,
    text: theme.text,
    subtext: theme.subtext,
    accent: theme.accent,
    accent2: theme.accent2 ?? theme.accent,
    accentSoft: theme.accentSoft,
    fontFamily: theme.fontFamily,
    displayFontFamily: theme.fontFamily,
    monoFontFamily: theme.codeFontFamily,
  };
}

/** 拍の情報（frame は部品が出てからのフレーム） */
export function beatInfo(frame: number, framesPerBeat: number): BeatInfo {
  const index = Math.max(0, frame) / framesPerBeat;
  const phase = index - Math.floor(index);
  return { framesPerBeat, index, pulse: frame < 0 ? 0 : Math.exp(-phase * 5) };
}

/** 決まった数列の乱数（0〜1）。seed が同じなら毎回同じ値 */
export function random(seed: number | string): number {
  let h = typeof seed === "number" ? seed * 2654435761 : 2166136261;
  if (typeof seed === "string") for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 0→1 のなめらかな出方（frame: 出てからのフレーム, len: かけるフレーム数） */
export function ease(frame: number, len: number, easing: (t: number) => number = Easing.out(Easing.cubic)): number {
  return interpolate(frame, [0, Math.max(1, len)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}

/** 弾む出方（0→1。少し行き過ぎて戻る） */
export function pop(frame: number, fps: number, damping = 12): number {
  return spring({ frame: Math.max(0, frame), fps, config: { damping, stiffness: 180, mass: 0.6 } });
}

/** 文中の **語** をアクセントの色にするための分割 */
export function splitEmphasis(text: string): { text: string; em: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => (t.startsWith("**") ? { text: t.slice(2, -2), em: true } : { text: t, em: false }));
}

/** 数を 3 桁区切りで（小数は decimals 桁） */
export function formatNumber(v: number, decimals = 0): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
