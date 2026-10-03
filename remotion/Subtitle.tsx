// F8: 焼き込み字幕。文の開始から次の文の開始まで表示する（文の間で消えてちらつかないように）。
import { useCurrentFrame } from "remotion";
import type { ResolvedScene } from "../src/schema";
import type { Layout } from "./layout";
import type { Theme } from "./theme";

export const Subtitle: React.FC<{ scene: ResolvedScene; box: NonNullable<Layout["subtitle"]>; theme: Theme }> = ({ scene, box, theme }) => {
  const frame = useCurrentFrame();
  const i = scene.sentences.findLastIndex((s) => s.from <= frame);
  const s = scene.sentences[i];
  if (!s) return null;
  // 最後の文は話し終えて少し経ったら消す
  const last = i === scene.sentences.length - 1;
  if (last && frame >= s.from + s.durationInFrames + 9) return null;
  const st = theme.subtitle;
  return (
    <div
      data-gmm-subtitle
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        data-gmm-subtitle-text
        style={{
          fontSize: st.fontSize,
          lineHeight: `${box.lineHeight}px`,
          fontWeight: 700,
          color: st.color,
          textAlign: "center",
          // 背景は文字の幅に合わせた帯にする（短い字幕で横長の箱が出ないように）
          background: st.background,
          borderRadius: 14,
          padding: "6px 32px",
          maxWidth: "100%",
          boxSizing: "border-box",
          textShadow: st.stroke === "none" ? undefined : outline(Math.max(3, Math.round(st.fontSize / 9)), st.stroke),
        }}
      >
        {s.text}
      </div>
    </div>
  );
};

/** 縁取り。円周上に影を並べて作る（-webkit-text-stroke は文字の内側も塗りつぶしてしまうため） */
function outline(r: number, color: string): string {
  const steps = 24;
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${color}`;
  }).join(", ");
}
