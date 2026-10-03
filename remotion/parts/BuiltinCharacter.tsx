// 組み込みキャラ「わかば」。素材がなくても立ち絵を試せるように SVG で描く。
import { BUILTIN_PALETTES, type BuiltinFace, type BuiltinPalette } from "../builtinCharacter";

type Props = { face: string; mouthOpen: boolean; blink: boolean; palette?: BuiltinPalette };

const SKIN = "#ffe6d2";
const LINE = "#3b2a22";

export const BuiltinCharacter: React.FC<Props> = ({ face, mouthOpen, blink, palette = BUILTIN_PALETTES.builtin }) => {
  const f = face as BuiltinFace;
  const { hair: HAIR, hairDark, leaf, outfit } = palette;
  return (
    <svg viewBox="0 0 340 500" width="100%" height="100%">
      {/* 体 */}
      <path d="M70 500 C70 380 110 330 170 330 C230 330 270 380 270 500 Z" fill={outfit} />
      <path d="M140 330 L170 380 L200 330 Z" fill="#ffffff" />
      <rect x="152" y="300" width="36" height="40" fill={SKIN} />
      {/* 後ろ髪 */}
      <path d="M58 190 C50 300 80 340 110 330 L230 330 C260 340 290 300 282 190 Z" fill={hairDark} />
      {/* 顔 */}
      <ellipse cx="170" cy="200" rx="112" ry="118" fill={SKIN} />
      {/* 前髪 */}
      <path d="M56 200 C50 110 110 70 170 70 C230 70 290 110 284 200 C260 150 230 130 200 128 C190 150 160 160 120 150 C100 160 80 175 56 200 Z" fill={HAIR} />
      {/* 頭の葉っぱ */}
      <path d="M170 74 C150 30 170 10 200 6 C205 40 195 62 170 74 Z" fill={leaf} stroke={hairDark} strokeWidth="3" />
      <path d="M170 74 C185 50 192 30 200 6" stroke={hairDark} strokeWidth="3" fill="none" />
      {/* ほお */}
      <ellipse cx="102" cy="240" rx="18" ry="10" fill="#ffb3b3" opacity={f === "smile" ? 0.9 : 0.6} />
      <ellipse cx="238" cy="240" rx="18" ry="10" fill="#ffb3b3" opacity={f === "smile" ? 0.9 : 0.6} />
      <Brows face={f} />
      <Eye cx={124} face={f} blink={blink} iris={hairDark} />
      <Eye cx={216} face={f} blink={blink} iris={hairDark} />
      <Mouth face={f} open={mouthOpen} />
    </svg>
  );
};

const Brows: React.FC<{ face: BuiltinFace }> = ({ face }) => {
  const d =
    face === "troubled"
      ? ["M100 158 L144 170", "M240 158 L196 170"]
      : face === "surprised"
        ? ["M102 150 Q124 138 146 150", "M194 150 Q216 138 238 150"]
        : face === "think"
          ? ["M102 162 L146 162", "M194 152 Q216 140 238 156"]
          : ["M102 160 Q124 152 146 160", "M194 160 Q216 152 238 160"];
  return (
    <g stroke={LINE} strokeWidth="5" strokeLinecap="round" fill="none">
      {d.map((x) => (
        <path key={x} d={x} />
      ))}
    </g>
  );
};

const Eye: React.FC<{ cx: number; face: BuiltinFace; blink: boolean; iris: string }> = ({ cx, face, blink, iris }) => {
  const cy = 200;
  if (blink) return <path d={`M${cx - 20} ${cy + 4} Q${cx} ${cy + 14} ${cx + 20} ${cy + 4}`} stroke={LINE} strokeWidth="6" fill="none" strokeLinecap="round" />;
  if (face === "smile") return <path d={`M${cx - 20} ${cy + 8} Q${cx} ${cy - 16} ${cx + 20} ${cy + 8}`} stroke={LINE} strokeWidth="7" fill="none" strokeLinecap="round" />;
  const r = face === "surprised" ? 1.2 : 1;
  const look = face === "think" ? 7 : 0;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={17 * r} ry={24 * r} fill="#ffffff" stroke={LINE} strokeWidth="4" />
      <ellipse cx={cx + look} cy={cy + 3} rx={11 * r} ry={16 * r} fill={iris} />
      <ellipse cx={cx + look} cy={cy + 5} rx={6 * r} ry={9 * r} fill={LINE} />
      <circle cx={cx + look - 5} cy={cy - 6} r={5} fill="#ffffff" />
    </g>
  );
};

const Mouth: React.FC<{ face: BuiltinFace; open: boolean }> = ({ face, open }) => {
  const y = 262;
  if (open) {
    const [rx, ry] = face === "surprised" ? [16, 20] : face === "smile" ? [22, 16] : face === "think" || face === "troubled" ? [11, 9] : [16, 13];
    return (
      <g>
        <ellipse cx="170" cy={y + 4} rx={rx} ry={ry} fill="#b5364a" stroke={LINE} strokeWidth="4" />
        <ellipse cx="170" cy={y + 4 + ry * 0.45} rx={rx * 0.6} ry={ry * 0.4} fill="#ff8a95" />
      </g>
    );
  }
  const d =
    face === "smile"
      ? `M146 ${y - 4} Q170 ${y + 20} 194 ${y - 4}`
      : face === "surprised"
        ? ""
        : face === "troubled"
          ? `M152 ${y + 4} Q161 ${y - 4} 170 ${y + 4} Q179 ${y + 12} 188 ${y + 4}`
          : face === "think"
            ? `M156 ${y + 2} L184 ${y}`
            : `M156 ${y} Q170 ${y + 10} 184 ${y}`;
  if (!d) return <ellipse cx="170" cy={y + 4} rx="8" ry="10" fill="#b5364a" stroke={LINE} strokeWidth="4" />;
  return <path d={d} stroke={LINE} strokeWidth="5" fill="none" strokeLinecap="round" />;
};
