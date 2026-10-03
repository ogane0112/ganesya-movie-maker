import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

/** 数式（KaTeX で事前に描いた HTML） */
export const MathBlock: React.FC<{ html: string; from: number; theme: Theme }> = ({ html, from, theme }) => {
  const p = useAppear(from);
  return (
    <div
      data-gmm-el="math"
      data-gmm-text
      style={{ ...appearStyle(p), fontSize: theme.fontSize * 1.1, color: theme.text, flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
