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
  marker: z.string(),
  fontFamily: z.string(),
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
    /** 文字の縁取り */
    stroke: z.string(),
    /** 字幕帯の背景（不要なら transparent） */
    background: z.string(),
  }),
  /** 追加のフォント。src はテーマファイルからの相対パス */
  fonts: z.array(z.object({ family: z.string(), src: z.string(), weight: z.union([z.number(), z.string()]).default(400) })).default([]),
});
export type Theme = z.infer<typeof Theme>;

const FONT = '"Noto Sans JP", "IPAGothic", sans-serif';
const CODE_FONT = '"JetBrains Mono", "Noto Sans JP", monospace';

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
    subtitle: { fontSize: 44, color: "#ffffff", stroke: "#24502a", background: "rgba(31, 45, 31, 0.0)" },
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
    subtitle: { fontSize: 44, color: "#ffffff", stroke: "#000000", background: "rgba(0, 0, 0, 0.0)" },
    fonts: [],
  },
};
