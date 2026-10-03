import { interpolate, useCurrentFrame } from "remotion";
import type { CodeToken } from "../../src/schema";
import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

type Props = {
  lines: CodeToken[][];
  background: string;
  lang: string;
  from: number;
  highlights: { from: number; lines: number[] }[];
  theme: Theme;
};

export const Code: React.FC<Props> = ({ lines, background, lang, from, highlights, theme }) => {
  const frame = useCurrentFrame();
  const p = useAppear(from);
  // いま有効なハイライト（最後に始まったもの）
  const active = [...highlights].reverse().find((h) => frame >= h.from);
  const fade = active ? interpolate(frame, [active.from, active.from + 8], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const fontSize = Math.round(theme.fontSize * 0.75);
  return (
    <div
      data-gmm-el="code"
      style={{
        ...appearStyle(p),
        background,
        borderRadius: 20,
        padding: "36px 0",
        position: "relative",
        overflow: "hidden",
        // 縮んで行が隠れると検査で見つけられないので、縮ませない
        flexShrink: 0,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 24, fontSize: 22, color: "#8b949e", fontFamily: theme.codeFontFamily }}>{lang}</div>
      {lines.map((tokens, i) => {
        const lit = active?.lines.includes(i + 1) ?? false;
        const dim = active && !lit ? 1 - 0.55 * fade : 1;
        return (
          <div
            key={i}
            data-gmm-text
            data-gmm-clip
            style={{
              fontFamily: theme.codeFontFamily,
              fontSize,
              lineHeight: 1.6,
              whiteSpace: "pre",
              // 合字（=> → ⇒ など）を使わず、書いたとおりに見せる
              fontVariantLigatures: "none",
              padding: "0 48px",
              opacity: dim,
              background: lit ? `rgba(255,255,255,${0.12 * fade})` : "transparent",
              borderLeft: `8px solid ${lit ? `rgba(108,192,112,${fade})` : "transparent"}`,
              overflow: "hidden",
            }}
          >
            {tokens.length === 0 ? " " : tokens.map((t, j) => (
              <span key={j} style={{ color: t.color }}>
                {t.content}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};
