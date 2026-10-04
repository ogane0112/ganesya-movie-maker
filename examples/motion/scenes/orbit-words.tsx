// 場面のコードの例（SVG）：中心の言葉の周りを、小さな言葉が拍に合わせて回る。
// 受け取るもの（frame・拍・色など）は gmm-motion の MotionSceneProps。乱数は random(seed) を使う。
import { ease, random, type MotionSceneProps } from "gmm-motion";

export default function OrbitWords({ frame, width, height, beat, palette, props }: MotionSceneProps) {
  const words = (props.words ?? "AI,動画,台本,音楽,3D,拍").split(",");
  const center = props.center ?? "gmm";
  const cx = width / 2;
  const cy = height / 2;
  const intro = ease(frame, beat.framesPerBeat * 2);
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {[260, 380, 500].map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={r * intro} fill="none" stroke={i % 2 ? palette.accent2 : palette.accent} strokeOpacity={0.25 + 0.3 * beat.pulse} strokeWidth={2} />
      ))}
      {words.map((w, i) => {
        const ring = [260, 380, 500][i % 3];
        const a = (i / words.length) * Math.PI * 2 + (frame / beat.framesPerBeat) * 0.12 * (i % 2 ? 1 : -1);
        const x = cx + Math.cos(a) * ring * intro;
        const y = cy + Math.sin(a) * ring * 0.55 * intro;
        const size = 40 + random(i) * 24;
        return (
          <text key={w} data-gmm-text x={x} y={y} fontSize={size} fontWeight={700} fill={i % 2 ? palette.accent2 : palette.text} textAnchor="middle" dominantBaseline="middle" fontFamily={palette.fontFamily} opacity={intro}>
            {w}
          </text>
        );
      })}
      <text x={cx} y={cy} fontSize={180 * (1 + 0.05 * beat.pulse)} fontWeight={900} fill={palette.text} textAnchor="middle" dominantBaseline="middle" fontFamily={palette.fontFamily} opacity={intro}>
        {center}
      </text>
    </svg>
  );
}
