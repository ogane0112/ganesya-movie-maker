// 組み込みキャラの定義（Node 側からも読むので JSX を含めない）
export const BUILTIN_FACES = ["normal", "smile", "surprised", "troubled", "think"] as const;
export type BuiltinFace = (typeof BUILTIN_FACES)[number];

export const BUILTIN_CHARACTER = {
  name: "わかば（組み込み）",
  width: 340,
  height: 500,
  defaultFace: "normal",
};

/** 組み込みキャラの色違い。立ち絵素材が無い話者の代わりに使う（builtin-<名前>） */
export const BUILTIN_PALETTES = {
  builtin: { name: "わかば（組み込み）", hair: "#4f9a4a", hairDark: "#3a7a37", leaf: "#7cc576", outfit: "#3d8b40" },
  "builtin-metan": { name: "めたん代役（組み込み）", hair: "#d4569b", hairDark: "#a63a77", leaf: "#f29ac7", outfit: "#5b3b8c" },
  "builtin-blue": { name: "あお（組み込み）", hair: "#4a7fc1", hairDark: "#335f96", leaf: "#8fbbe8", outfit: "#2f5d8a" },
} as const;
export type BuiltinPalette = (typeof BUILTIN_PALETTES)[keyof typeof BUILTIN_PALETTES];
