// :::custom の場面のコードの登録表。実体は書き出しのたびに build/<台本名>/custom-scenes.tsx に作られ、
// バンドラ（remotion の webpack と検査用の esbuild）でこの名前に差し替えられる（src/motion/custom.ts）。
declare module "gmm-custom-scenes" {
  import type { ComponentType } from "react";
  import type { MotionSceneProps } from "./kit";
  export const CUSTOM_SCENES: Record<string, ComponentType<MotionSceneProps>>;
}

// 場面のコードから使う道具（remotion/motion/kit.ts）
declare module "gmm-motion" {
  export * from "./kit";
}
