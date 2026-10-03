import { Img, staticFile } from "remotion";
import type { Theme } from "../theme";
import { appearStyle, useAppear } from "../anim";

/** 画像。空いている高さに収まるよう縮める（はみ出さない） */
export const ImageView: React.FC<{ src: string; caption?: string; from: number; theme: Theme }> = ({ src, caption, from, theme }) => {
  const p = useAppear(from);
  return (
    <figure
      data-gmm-el="image"
      style={{ ...appearStyle(p), margin: 0, flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
    >
      <Img src={staticFile(src)} style={{ flex: "1 1 0", minHeight: 0, maxWidth: "100%", objectFit: "contain", borderRadius: 12 }} />
      {caption && (
        <figcaption data-gmm-text style={{ fontSize: theme.fontSize * 0.7, color: theme.subtext, flexShrink: 0 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
