// 図解（箱と矢印）。箱を一列に並べ、隣り合う箱の間に矢印を引く。
import { interpolate, useCurrentFrame } from "remotion";
import type { ResolvedElement } from "../../src/schema";
import type { Theme } from "../theme";
import { useAppear } from "../anim";

type Props = Extract<ResolvedElement, { type: "diagram" }> & { theme: Theme };

const EASE = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Diagram: React.FC<Props> = ({ direction, nodes, edges, theme }) => {
  const lr = direction === "LR";
  return (
    <div
      data-gmm-el="diagram"
      style={{
        display: "flex",
        flexDirection: lr ? "row" : "column",
        alignItems: "stretch",
        justifyContent: "center",
        flexShrink: 0,
        margin: lr ? "auto 0" : 0,
      }}
    >
      {nodes.map((n, i) => (
        <div key={i} style={{ display: "contents" }}>
          {i > 0 && <Edge edge={edges[i - 1]} lr={lr} theme={theme} />}
          <Node {...n} theme={theme} lr={lr} />
        </div>
      ))}
    </div>
  );
};

const Node: React.FC<{ text: string; from: number; emphasisFrom?: number; theme: Theme; lr: boolean }> = ({ text, from, emphasisFrom, theme, lr }) => {
  const frame = useCurrentFrame();
  const p = useAppear(from);
  const em = emphasisFrom === undefined ? 0 : interpolate(frame, [emphasisFrom, emphasisFrom + 8], [0, 1], EASE);
  // 強調の瞬間に少しだけ大きくする
  const pop = emphasisFrom === undefined ? 0 : interpolate(frame, [emphasisFrom, emphasisFrom + 5, emphasisFrom + 12], [0, 0.06, 0], EASE);
  return (
    <div
      data-gmm-text
      // 箱より長い語は検査で「はみ出し」として見つける
      data-gmm-clip
      style={{
        flex: lr ? "1 1 0" : "none",
        minWidth: 0,
        opacity: p,
        transform: `scale(${(0.9 + 0.1 * p) * (1 + pop)})`,
        background: em > 0 ? mix(theme.surface, theme.accentSoft, em) : theme.surface,
        border: `4px solid ${em > 0 ? theme.accent : theme.subtext}`,
        borderRadius: 20,
        padding: lr ? "40px 12px" : "24px 40px",
        fontSize: theme.fontSize * 0.75,
        fontWeight: 700,
        color: theme.text,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      {text}
    </div>
  );
};

const Edge: React.FC<{ edge: Props["edges"][number]; lr: boolean; theme: Theme }> = ({ edge, lr, theme }) => {
  const frame = useCurrentFrame();
  if (!edge) return <div style={{ flex: "none", ...(lr ? { width: 48 } : { height: 32 }) }} />;
  const labelSize = theme.fontSize * 0.6;
  // 横向きはラベルが収まる幅にする（全角1文字 ≒ 1em、半角 ≒ 0.6em）
  const labelWidth = [...(edge.label ?? "")].reduce((w, c) => w + (/[\x20-\x7e]/.test(c) ? 0.6 : 1) * labelSize, 0);
  // 矢印の長さ（px）と、線を描く向きの座標
  const len = lr ? Math.max(120, Math.ceil(labelWidth) + 48) : 100;
  const thick = 40;
  const [w, h] = lr ? [len, thick] : [thick, len];
  const draw = interpolate(frame, [edge.from, edge.from + 12], [0, 1], EASE);
  const m = 10; // 箱との隙間
  const p1 = lr ? [m, h / 2] : [w / 2, m];
  const p2 = lr ? [w - m, h / 2] : [w / 2, h - m];
  const head = ([x, y]: number[], dir: 1 | -1) =>
    lr ? `M${x - 16 * dir} ${y - 14} L${x} ${y} L${x - 16 * dir} ${y + 14}` : `M${x - 14} ${y - 16 * dir} L${x} ${y} L${x + 14} ${y - 16 * dir}`;
  const showHead = draw >= 1;
  return (
    <div style={{ flex: "none", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", ...(lr ? { width: w } : { height: h }) }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <g stroke={theme.accent} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          {showHead && (edge.arrow === "->" || edge.arrow === "<->") && <path d={head(p2, 1)} />}
          {showHead && (edge.arrow === "<-" || edge.arrow === "<->") && <path d={head(p1, -1)} />}
        </g>
      </svg>
      {edge.label && (
        <div
          data-gmm-text
          style={{
            position: "absolute",
            ...(lr ? { bottom: "50%", marginBottom: 18, left: 0, right: 0 } : { left: "50%", marginLeft: 32 }),
            whiteSpace: "nowrap",
            textAlign: lr ? "center" : "left",
            fontSize: labelSize,
            color: theme.subtext,
            opacity: draw,
          }}
        >
          {edge.label}
        </div>
      )}
    </div>
  );
};

/** 2色を t で混ぜる（#rrggbb のみ） */
function mix(a: string, b: string, t: number): string {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return t < 0.5 ? a : b;
  const [ca, cb] = [p(a), p(b)];
  return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(",")})`;
}
