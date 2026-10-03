import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

/** 用語カード。専門用語とその一言説明を出す */
export const TermCard: React.FC<{ term: string; description: string; from: number; theme: Theme }> = ({ term, description, from, theme }) => {
  const p = useAppear(from);
  return (
    <div
      data-gmm-el="term"
      style={{
        ...appearStyle(p),
        flexShrink: 0,
        background: theme.surface,
        border: `4px solid ${theme.accent}`,
        borderRadius: 20,
        padding: "28px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span
          data-gmm-text
          style={{ fontSize: theme.fontSize * 0.6, fontWeight: 700, color: theme.surface, background: theme.accent, borderRadius: 10, padding: "2px 16px" }}
        >
          用語
        </span>
        <span data-gmm-text style={{ fontSize: theme.fontSize * 1.05, fontWeight: 700, color: theme.text }}>
          {term}
        </span>
      </div>
      <div data-gmm-text style={{ fontSize: theme.fontSize * 0.8, color: theme.text, lineHeight: 1.5 }}>
        {description}
      </div>
    </div>
  );
};
