// テーマ（色・フォント・余白）。組み込みテーマか、それを extends で上書きする JSON ファイル（F13）。
// Node 側で解決して timeline.theme に載せるので、Remotion 側は名前ではなく中身を受け取る。
import { z } from "zod";

export const Theme = z.object({
  name: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  subtext: z.string(),
  accent: z.string(),
  accentSoft: z.string(),
  /** 2つ目のアクセント（モーション動画のグラデーション・強調）。省略時は accent */
  accent2: z.string().optional(),
  marker: z.string(),
  fontFamily: z.string(),
  /** 大きな文字（題名・キネティック）と数字のフォント。省略時は fontFamily */
  displayFontFamily: z.string().optional(),
  numberFontFamily: z.string().optional(),
  codeFontFamily: z.string(),
  /** Shiki のテーマ名 */
  codeTheme: z.string(),
  /** 1080p 換算の基本文字サイズ（px） */
  fontSize: z.number(),
  /** 画面端からの余白（px） */
  padding: z.number(),
  /** 字幕 */
  subtitle: z.object({
    fontSize: z.number(),
    color: z.string(),
    /** 文字の縁取りの色（none で縁取りなし） */
    stroke: z.string(),
    /** 字幕の背景（文字の幅に合わせた帯。不要なら transparent） */
    background: z.string(),
  }),
  /** 追加のフォント。src はテーマファイルからの相対パス */
  fonts: z.array(z.object({ family: z.string(), src: z.string(), weight: z.union([z.number(), z.string()]).default(400) })).default([]),
});
export type Theme = z.infer<typeof Theme>;

const FONT = '"Noto Sans JP", "IPAGothic", sans-serif';
const CODE_FONT = '"JetBrains Mono", "Noto Sans JP", monospace';
// モーション動画：幾何学的で太い字に強い M PLUS 1 と、英数字を Outfit で（Google Fonts）
const MOTION_FONT = '"M PLUS 1", "Noto Sans JP", sans-serif';
const MOTION_DISPLAY = '"Outfit", "M PLUS 1", "Noto Sans JP", sans-serif';

export const THEMES: Record<string, Theme> = {
  // Marp スライドと揃えた緑基調
  wakaba: {
    name: "wakaba",
    background: "#f6faf3",
    surface: "#ffffff",
    text: "#1f2d1f",
    subtext: "#5b6e5b",
    accent: "#3d8b40",
    accentSoft: "#dcefd8",
    marker: "rgba(255, 214, 10, 0.55)",
    fontFamily: FONT,
    codeFontFamily: CODE_FONT,
    codeTheme: "github-dark",
    fontSize: 48,
    padding: 96,
    subtitle: { fontSize: 44, color: "#ffffff", stroke: "none", background: "rgba(104, 168, 100, 0.85)" },
    fonts: [],
  },
  // モーション動画の既定。濃い紺に青緑と桃色
  night: {
    name: "night",
    background: "#0b0f1a",
    surface: "#151b2b",
    text: "#f4f7fb",
    subtext: "#93a0b8",
    accent: "#3ee6c1",
    accentSoft: "#123a3a",
    accent2: "#ff4f9a",
    marker: "rgba(62, 230, 193, 0.35)",
    fontFamily: MOTION_FONT,
    displayFontFamily: MOTION_DISPLAY,
    numberFontFamily: MOTION_DISPLAY,
    codeFontFamily: CODE_FONT,
    codeTheme: "github-dark",
    fontSize: 48,
    padding: 96,
    subtitle: { fontSize: 44, color: "#ffffff", stroke: "none", background: "rgba(11, 15, 26, 0.78)" },
    fonts: [],
  },
  // ネタ動画の既定。白地に赤と黄色、太い M PLUS 1
  pop: {
    name: "pop",
    background: "#fff8ec",
    surface: "#ffffff",
    text: "#1d1a24",
    subtext: "#6b6475",
    accent: "#ff4757",
    accentSoft: "#ffe1e4",
    accent2: "#ffd60a",
    marker: "rgba(255, 214, 10, 0.6)",
    fontFamily: MOTION_FONT,
    displayFontFamily: MOTION_FONT,
    numberFontFamily: MOTION_DISPLAY,
    codeFontFamily: CODE_FONT,
    codeTheme: "github-dark",
    fontSize: 48,
    padding: 64,
    subtitle: { fontSize: 56, color: "#ffffff", stroke: "#1d1a24", background: "transparent" },
    fonts: [],
  },
  dark: {
    name: "dark",
    background: "#16191d",
    surface: "#20252b",
    text: "#eef1f4",
    subtext: "#9aa5b1",
    accent: "#6cc070",
    accentSoft: "#26402a",
    marker: "rgba(255, 196, 0, 0.45)",
    fontFamily: FONT,
    codeFontFamily: CODE_FONT,
    codeTheme: "github-dark",
    fontSize: 48,
    padding: 96,
    subtitle: { fontSize: 44, color: "#ffffff", stroke: "none", background: "rgba(0, 0, 0, 0.72)" },
    fonts: [],
  },
};
