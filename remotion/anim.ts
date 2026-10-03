// 部品共通のアニメーション。乱数・現在時刻は使わない（再現性）。
import { interpolate, useCurrentFrame } from "remotion";

const EASE = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** from フレームから fadeFrames かけて 0→1 */
export function useAppear(from: number, fadeFrames = 10): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + fadeFrames], [0, 1], EASE);
}

export function appearStyle(progress: number, dy = 24): React.CSSProperties {
  return { opacity: progress, transform: `translateY(${(1 - progress) * dy}px)` };
}
