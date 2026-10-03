import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

export const Title: React.FC<{ title: string; subtitle?: string; from: number; theme: Theme }> = ({
  title,
  subtitle,
  from,
  theme,
}) => {
  const p = useAppear(from, 15);
  return (
    <div
      data-gmm-el="title"
      style={{ ...appearStyle(p, 30), display: "flex", flexDirection: "column", alignItems: "center", gap: 32, margin: "auto 0" }}
    >
      <div data-gmm-text style={{ fontSize: theme.fontSize * 1.75, fontWeight: 700, color: theme.text, textAlign: "center", lineHeight: 1.3 }}>
        {title}
      </div>
      <div style={{ width: 160, height: 8, borderRadius: 4, background: theme.accent }} />
      {subtitle && (
        <div data-gmm-text style={{ fontSize: theme.fontSize * 0.85, color: theme.subtext, textAlign: "center" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
