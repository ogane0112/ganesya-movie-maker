import { interpolate, useCurrentFrame } from "remotion";
import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

type Item = { text: string; from: number; emphasisFrom?: number };

const BulletItem: React.FC<{ item: Item; theme: Theme }> = ({ item, theme }) => {
  const frame = useCurrentFrame();
  const p = useAppear(item.from);
  // 強調マーカーは左から右へ引く
  const mark =
    item.emphasisFrom === undefined
      ? 0
      : interpolate(frame, [item.emphasisFrom, item.emphasisFrom + 12], [0, 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <li style={{ ...appearStyle(p, 0), transform: `translateX(${(1 - p) * -30}px)`, display: "flex", gap: 28, alignItems: "baseline" }}>
      <span style={{ flex: "none", width: 18, height: 18, borderRadius: 9, background: theme.accent, transform: "translateY(-6px)" }} />
      <span
        data-gmm-text
        style={{
          fontSize: theme.fontSize,
          color: theme.text,
          lineHeight: 1.5,
          backgroundImage: `linear-gradient(${theme.marker}, ${theme.marker})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 85%",
          backgroundSize: `${mark}% 40%`,
        }}
      >
        {item.text}
      </span>
    </li>
  );
};

export const Bullets: React.FC<{ items: Item[]; theme: Theme }> = ({ items, theme }) => (
  <ul data-gmm-el="bullets" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 36 }}>
    {items.map((item, i) => (
      <BulletItem key={i} item={item} theme={theme} />
    ))}
  </ul>
);
