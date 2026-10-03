// テーマ（色・フォント・余白）。F13 でファイルから読めるようにする予定。今は組み込みのみ。
export type Theme = {
  name: string;
  background: string;
  surface: string;
  text: string;
  subtext: string;
  accent: string;
  accentSoft: string;
  marker: string;
  fontFamily: string;
  codeFontFamily: string;
  codeTheme: string;
  /** 1080p 換算の基本文字サイズ（px） */
  fontSize: number;
  /** 画面端からの余白（px）。検査の「安全領域」もこれを使う */
  padding: number;
};

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
  },
};

export function getTheme(name: string): Theme {
  const t = THEMES[name];
  if (!t) throw new Error(`テーマ「${name}」はありません。使えるのは: ${Object.keys(THEMES).join(", ")}`);
  return t;
}
