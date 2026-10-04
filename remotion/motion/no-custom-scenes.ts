// :::custom を使わない動画（と、登録表をまだ作っていないとき）の空の登録表
import type { ComponentType } from "react";
import type { MotionSceneProps } from "./kit";

export const CUSTOM_SCENES: Record<string, ComponentType<MotionSceneProps>> = {};
