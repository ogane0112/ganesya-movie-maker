import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

export const Text: React.FC<{ text: string; variant: "plain" | "callout"; from: number; theme: Theme }> = ({
  text,
  variant,
  from,
  theme,
}) => {
  const p = useAppear(from);
  const callout = variant === "callout";
  return (
    <div
      data-gmm-el="text"
      data-gmm-text
      style={{
        ...appearStyle(p),
        fontSize: theme.fontSize,
        lineHeight: 1.6,
        color: theme.text,
        whiteSpace: "pre-wrap",
        ...(callout && {
          background: theme.accentSoft,
          borderLeft: `12px solid ${theme.accent}`,
          borderRadius: 16,
          padding: "28px 40px",
          fontWeight: 700,
        }),
      }}
    >
      {text}
    </div>
  );
};
