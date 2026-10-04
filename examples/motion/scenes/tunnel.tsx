// 場面のコードの例（Three.js）：光の輪のトンネルを進む。拍ごとに輪が光る。
// @remotion/three の ThreeCanvas を使い、姿はフレーム番号だけから決める。
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame } from "remotion";
import type { MotionSceneProps } from "gmm-motion";

export default function Tunnel({ width, height, beat, palette }: MotionSceneProps) {
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 0], fov: 70 }}>
      <Rings fpb={beat.framesPerBeat} a={palette.accent} b={palette.accent2} />
    </ThreeCanvas>
  );
}

function Rings({ fpb, a, b }: { fpb: number; a: string; b: string }) {
  const frame = useCurrentFrame(); // ThreeCanvas の中でも使える
  const t = frame / fpb; // 拍で数えた時間
  const n = 24;
  return (
    <group rotation={[0, 0, t * 0.15]}>
      {Array.from({ length: n }, (_, i) => {
        // 奥から手前へ流れてくる（1 拍で輪 1 つ分進む）
        const z = -((i - (t % 1)) * 2.5) - 1;
        const lit = Math.floor(t) % n === i;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, i * 0.3]}>
            <torusGeometry args={[3, lit ? 0.09 : 0.04, 8, 6]} />
            <meshBasicMaterial color={i % 2 ? a : b} transparent opacity={Math.max(0.1, 1 + z / 60)} />
          </mesh>
        );
      })}
    </group>
  );
}
