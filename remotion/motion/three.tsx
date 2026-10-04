// 組み込みの 3D の場面（:::three preset=…）。@remotion/three の ThreeCanvas に、フレーム番号から決まる姿を描く。
// 自分で 3D を書きたいときは :::custom の場面のコードで ThreeCanvas を使う（docs/motion.md）。
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { ResolvedMotionElement } from "../../src/motion/schema";
import { beatInfo, ease, random, type Palette } from "./kit";

type El = Extract<ResolvedMotionElement, { type: "three" }>;

export const ThreeScene: React.FC<{ el: El; fpb: number; palette: Palette }> = ({ el, fpb, palette }) => {
  const { width, height } = useVideoConfig();
  return (
    <div data-gmm-el="backdrop" style={{ position: "absolute", inset: 0 }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 12], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 6]} intensity={1.4} />
        <pointLight position={[-6, -4, 4]} intensity={30} color={palette.accent2} />
        <Preset preset={el.preset} fpb={fpb} palette={palette} />
      </ThreeCanvas>
    </div>
  );
};

const Preset: React.FC<{ preset: El["preset"]; fpb: number; palette: Palette }> = ({ preset, fpb, palette }) => {
  // ThreeCanvas の中でも useCurrentFrame は使える（部品が出てからのフレーム）
  const frame = useCurrentFrame();
  const t = frame / fpb; // 拍で数えた時間
  const pulse = beatInfo(frame, fpb).pulse;
  const intro = ease(frame, fpb * 2);
  switch (preset) {
    case "globe":
      return <Globe t={t} pulse={pulse} intro={intro} palette={palette} />;
    case "particles":
      return <Particles t={t} pulse={pulse} intro={intro} palette={palette} />;
    case "rings":
      return (
        <group rotation={[0.4, t * 0.15, 0]} scale={0.6 + 0.4 * intro}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[t * 0.3 * (i % 2 ? 1 : -1) + i, t * 0.2 + i * 0.7, 0]} scale={1 + 0.06 * pulse}>
              <torusGeometry args={[2 + i * 0.9, 0.08 + 0.02 * i, 16, 120]} />
              <meshStandardMaterial color={i % 2 ? palette.accent2 : palette.accent} emissive={i % 2 ? palette.accent2 : palette.accent} emissiveIntensity={0.3 + 0.7 * pulse} />
            </mesh>
          ))}
        </group>
      );
    default: {
      // cubes: 格子に並んだ立方体が波打ち、拍で跳ねる
      const n = 7;
      return (
        <group rotation={[0.6, t * 0.12, 0]} scale={0.5 + 0.5 * intro}>
          {Array.from({ length: n * n }, (_, k) => {
            const i = (k % n) - (n - 1) / 2;
            const j = Math.floor(k / n) - (n - 1) / 2;
            const wave = Math.sin(t * 0.9 + Math.hypot(i, j) * 0.8);
            const hit = Math.hypot(i, j) < 1.5 ? pulse : 0;
            return (
              <mesh key={k} position={[i * 1.25, wave * 0.6 + hit * 0.8, j * 1.25]}>
                <boxGeometry args={[0.9, 0.9 + 0.6 * (wave + 1) / 2, 0.9]} />
                <meshStandardMaterial color={(i + j) % 2 === 0 ? palette.accent : palette.surface} metalness={0.3} roughness={0.35} />
              </mesh>
            );
          })}
        </group>
      );
    }
  }
};

const Globe: React.FC<{ t: number; pulse: number; intro: number; palette: Palette }> = ({ t, pulse, intro, palette }) => {
  // 球面に並べた点（黄金角で並べる。乱数は使わない）
  const points = useMemo(() => {
    const n = 900;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      arr.set([Math.cos(th) * r * 3.2, y * 3.2, Math.sin(th) * r * 3.2], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <group rotation={[0.35, t * 0.25, 0]} scale={(0.4 + 0.6 * intro) * (1 + 0.04 * pulse)}>
      <mesh>
        <sphereGeometry args={[3.15, 48, 32]} />
        <meshStandardMaterial color={palette.background} transparent opacity={0.85} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.2, 24, 16]} />
        <meshBasicMaterial color={palette.accent} wireframe transparent opacity={0.18} />
      </mesh>
      <points geometry={points}>
        <pointsMaterial color={palette.accent} size={0.06 + 0.04 * pulse} />
      </points>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.2, 0.02, 8, 160]} />
        <meshBasicMaterial color={palette.accent2} />
      </mesh>
    </group>
  );
};

const Particles: React.FC<{ t: number; pulse: number; intro: number; palette: Palette }> = ({ t, pulse, intro, palette }) => {
  const n = 1500;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, []);
  // 渦を巻いて流れる点（位置はフレームから毎回計算する）
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < n; i++) {
    const r = 1 + random(i) * 6;
    const a = random(i + 7777) * Math.PI * 2 + t * (0.4 / r);
    const y = (random(i + 3333) - 0.5) * 6 + Math.sin(t * 0.3 + i) * 0.2;
    pos.setXYZ(i, Math.cos(a) * r, y * (1 - 0.6 * (1 - intro)), Math.sin(a) * r);
  }
  pos.needsUpdate = true;
  return (
    <group rotation={[0.5, 0, 0]}>
      <points geometry={geo}>
        <pointsMaterial color={palette.accent} size={0.05 + 0.05 * pulse} transparent opacity={0.9} />
      </points>
      <mesh>
        <sphereGeometry args={[0.6 + 0.2 * pulse, 32, 32]} />
        <meshBasicMaterial color={palette.accent2} />
      </mesh>
    </group>
  );
};
