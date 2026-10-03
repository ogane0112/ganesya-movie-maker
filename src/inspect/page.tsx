// 検査用ページ（ブラウザで動く）。Remotion の Thumbnail で任意フレームを描画し、
// data-gmm-* 属性の付いた要素の位置・文字サイズ・はみ出しを測って返す。
import { Thumbnail } from "@remotion/player";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { Timeline } from "../schema";
import { Video, type VideoProps } from "../../remotion/Video";
import type { Measurement } from "./rules";

const root = createRoot(document.getElementById("root")!);

async function show(timeline: Timeline, frame: number): Promise<void> {
  const { width, height, fps } = timeline.meta;
  flushSync(() =>
    root.render(
      <Thumbnail
        component={Video as React.FC<VideoProps>}
        inputProps={{ timeline, withAudio: false }}
        compositionWidth={width}
        compositionHeight={height}
        durationInFrames={timeline.durationInFrames}
        fps={fps}
        frameToDisplay={frame}
        style={{ width, height }}
      />,
    ),
  );
  for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
  await document.fonts.ready;
}

function measure(): Measurement {
  const scene = document.querySelector<HTMLElement>("[data-gmm-scene]");
  const canvas = document.querySelector<HTMLElement>("[data-gmm-canvas]");
  if (!scene || !canvas) throw new Error("シーンが描画されていません");
  // 座標は動画の画面（キャンバス）基準。シーン要素自体のはみ出しも測れるようにする
  const origin = canvas.getBoundingClientRect();
  const rect = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height };
  };
  return {
    sceneId: scene.dataset.gmmScene!,
    canvas: { width: origin.width, height: origin.height },
    elements: [...scene.querySelectorAll<HTMLElement>("[data-gmm-el]")].map((el) => ({ kind: el.dataset.gmmEl!, rect: rect(el) })),
    texts: [...scene.querySelectorAll<HTMLElement>("[data-gmm-text]")].map((el) => ({
      text: (el.textContent ?? "").slice(0, 40),
      fontSize: parseFloat(getComputedStyle(el).fontSize),
      rect: rect(el),
      clipped: el.hasAttribute("data-gmm-clip") && el.scrollWidth > el.clientWidth + 1,
    })),
  };
}

declare global {
  interface Window {
    gmm: { show: typeof show; measure: typeof measure };
  }
}
window.gmm = { show, measure };
