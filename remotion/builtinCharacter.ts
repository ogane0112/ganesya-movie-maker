// 組み込みキャラの定義（Node 側からも読むので JSX を含めない）
export const BUILTIN_FACES = ["normal", "smile", "surprised", "troubled", "think"] as const;
export type BuiltinFace = (typeof BUILTIN_FACES)[number];

export const BUILTIN_CHARACTER = {
  name: "わかば（組み込み）",
  width: 340,
  height: 500,
  defaultFace: "normal",
};
