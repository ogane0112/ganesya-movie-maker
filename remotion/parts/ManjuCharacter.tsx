// 組み込みの「まんじゅう型」キャラ（ゆっくり風の、顔だけの丸いキャラ）。素材なしでゆっくり風の動画を試せるように SVG で描く。
// manju-red: 赤いリボン / manju-witch: 黒い帽子 / manju-green: 葉っぱの髪飾り
import type { BuiltinFace, BuiltinPalette } from "../builtinCharacter";

type Props = { face: string; mouthOpen: boolean; blink: boolean; variant: string; palette: BuiltinPalette };

const SKIN = "#ffeedd";
const LINE = "#2d211c";
// 顔（まんじゅう）の輪郭。下が平たい
const BODY = "M28 250 C20 150 90 92 200 92 C310 92 380 150 372 250 C368 318 320 346 200 346 C80 346 32 318 28 250 Z";

export const ManjuCharacter: React.FC<Props> = ({ face, mouthOpen, blink, variant, palette }) => {
  const f = face as BuiltinFace;
  const { hair, hairDark, leaf } = palette;
  return (
    <svg viewBox="0 0 400 360" width="100%" height="100%">
      {/* 後ろ髪（顔の両脇に垂れる） */}
      <path d="M40 200 C20 260 30 330 70 350 L110 350 C80 300 76 240 90 190 Z" fill={hair} />
      <path d="M360 200 C380 260 370 330 330 350 L290 350 C320 300 324 240 310 190 Z" fill={hair} />
      {/* 顔 */}
      <path d={BODY} fill={SKIN} stroke={LINE} strokeWidth="5" />
      {/* 前髪 */}
      <path
        d="M30 236 C24 140 96 74 200 74 C304 74 376 140 370 236 C350 190 320 160 286 150 C270 172 236 182 206 164 C180 184 140 186 116 160 C80 170 52 196 30 236 Z"
        fill={hair}
        stroke={LINE}
        strokeWidth="4"
      />
      {/* 横の房 */}
      <path d="M44 214 C34 262 46 300 70 318 C66 280 70 246 86 214 Z" fill={hair} stroke={LINE} strokeWidth="3" />
      <path d="M356 214 C366 262 354 300 330 318 C334 280 330 246 314 214 Z" fill={hair} stroke={LINE} strokeWidth="3" />
      {/* ほお */}
      <ellipse cx="118" cy="282" rx="22" ry="11" fill="#ffaaa8" opacity={f === "smile" ? 0.95 : 0.65} />
      <ellipse cx="282" cy="282" rx="22" ry="11" fill="#ffaaa8" opacity={f === "smile" ? 0.95 : 0.65} />
      <Brows face={f} />
      <Eye cx={148} face={f} blink={blink} iris={variant === "manju-red" ? "#8a4a2a" : hairDark} />
      <Eye cx={252} face={f} blink={blink} iris={variant === "manju-red" ? "#8a4a2a" : hairDark} />
      <Mouth face={f} open={mouthOpen} />
      {variant === "manju-red" && <Ribbon color={leaf} />}
      {variant === "manju-witch" && <Hat color={leaf} />}
      {variant === "manju-green" && <Leaf color={leaf} line={hairDark} />}
    </svg>
  );
};

const Ribbon: React.FC<{ color: string }> = ({ color }) => (
  <g stroke={LINE} strokeWidth="4" strokeLinejoin="round">
    <path d="M200 64 L92 4 C70 40 78 92 108 110 Z" fill={color} />
    <path d="M200 64 L308 4 C330 40 322 92 292 110 Z" fill={color} />
    <path d="M118 44 L170 70 M282 44 L230 70" stroke="#ffffff" strokeWidth="8" opacity="0.7" />
    <rect x="180" y="46" width="40" height="40" rx="10" fill={color} />
  </g>
);

const Hat: React.FC<{ color: string }> = ({ color }) => (
  <g stroke={LINE} strokeWidth="4" strokeLinejoin="round">
    {/* つば */}
    <ellipse cx="200" cy="110" rx="196" ry="34" fill={color} />
    {/* 山（少し曲がった三角） */}
    <path d="M110 108 C140 70 170 30 230 -10 C236 30 262 70 290 108 Z" fill={color} />
    {/* リボン */}
    <path d="M124 96 C170 108 230 108 276 96 L282 82 C232 94 168 94 118 82 Z" fill="#ffffff" />
    <path d="M276 92 L318 70 L322 108 Z" fill="#ffffff" />
  </g>
);

const Leaf: React.FC<{ color: string; line: string }> = ({ color, line }) => (
  <g>
    <path d="M200 80 C170 40 190 8 236 0 C244 44 230 70 200 80 Z" fill={color} stroke={line} strokeWidth="4" />
    <path d="M200 80 C214 54 224 30 236 0" stroke={line} strokeWidth="4" fill="none" />
  </g>
);

const Brows: React.FC<{ face: BuiltinFace }> = ({ face }) => {
  const y = 196;
  const d =
    face === "troubled"
      ? [`M118 ${y - 6} L170 ${y + 8}`, `M282 ${y - 6} L230 ${y + 8}`]
      : face === "surprised"
        ? [`M120 ${y - 10} Q146 ${y - 26} 172 ${y - 10}`, `M228 ${y - 10} Q254 ${y - 26} 280 ${y - 10}`]
        : face === "think"
          ? [`M120 ${y} L172 ${y}`, `M228 ${y - 8} Q254 ${y - 22} 280 ${y - 4}`]
          : [`M122 ${y} Q146 ${y - 10} 170 ${y}`, `M230 ${y} Q254 ${y - 10} 278 ${y}`];
  return (
    <g stroke={LINE} strokeWidth="5" strokeLinecap="round" fill="none">
      {d.map((x) => (
        <path key={x} d={x} />
      ))}
    </g>
  );
};

const Eye: React.FC<{ cx: number; face: BuiltinFace; blink: boolean; iris: string }> = ({ cx, face, blink, iris }) => {
  const cy = 236;
  if (blink) return <path d={`M${cx - 24} ${cy + 4} Q${cx} ${cy + 16} ${cx + 24} ${cy + 4}`} stroke={LINE} strokeWidth="6" fill="none" strokeLinecap="round" />;
  if (face === "smile") return <path d={`M${cx - 24} ${cy + 10} Q${cx} ${cy - 18} ${cx + 24} ${cy + 10}`} stroke={LINE} strokeWidth="7" fill="none" strokeLinecap="round" />;
  const r = face === "surprised" ? 1.15 : 1;
  const look = face === "think" ? 8 : 0;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={22 * r} ry={28 * r} fill="#ffffff" stroke={LINE} strokeWidth="4" />
      <ellipse cx={cx + look} cy={cy + 4} rx={14 * r} ry={19 * r} fill={iris} />
      <ellipse cx={cx + look} cy={cy + 6} rx={7 * r} ry={10 * r} fill={LINE} />
      <circle cx={cx + look - 6} cy={cy - 6} r={6} fill="#ffffff" />
    </g>
  );
};

const Mouth: React.FC<{ face: BuiltinFace; open: boolean }> = ({ face, open }) => {
  const y = 296;
  if (open) {
    const [rx, ry] = face === "surprised" ? [18, 22] : face === "smile" ? [26, 18] : face === "think" || face === "troubled" ? [13, 10] : [19, 15];
    return (
      <g>
        <ellipse cx="200" cy={y + 4} rx={rx} ry={ry} fill="#b5364a" stroke={LINE} strokeWidth="4" />
        <ellipse cx="200" cy={y + 4 + ry * 0.45} rx={rx * 0.6} ry={ry * 0.4} fill="#ff8a95" />
      </g>
    );
  }
  const d =
    face === "smile"
      ? `M174 ${y - 4} Q200 ${y + 20} 226 ${y - 4}`
      : face === "surprised"
        ? ""
        : face === "troubled"
          ? `M180 ${y + 4} Q190 ${y - 4} 200 ${y + 4} Q210 ${y + 12} 220 ${y + 4}`
          : face === "think"
            ? `M186 ${y + 2} L214 ${y}`
            : `M184 ${y} Q200 ${y + 10} 216 ${y}`;
  if (!d) return <ellipse cx="200" cy={y + 4} rx="9" ry="11" fill="#b5364a" stroke={LINE} strokeWidth="4" />;
  return <path d={d} stroke={LINE} strokeWidth="5" fill="none" strokeLinecap="round" />;
};
