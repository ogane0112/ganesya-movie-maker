// 検査用ページ（ブラウザで動く）。Remotion の Thumbnail で任意フレームを描画し、
// data-gmm-* 属性の付いた要素の位置・文字サイズ・はみ出しを測って返す。
import { Thumbnail } from "@remotion/player";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { Timeline } from "../schema";
import { Video, type VideoProps } from "../../remotion/Video";
import type { Measurement, SubtitleMeasurement } from "./rules";

const root = createRoot(document.getElementById("root")!);
// 検査用ページであることを部品に知らせる（録画はコマの画像で表示する）
(window as unknown as { __gmmInspect: boolean }).__gmmInspect = true;

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
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  // 動画（ゲーム実況の録画）は、頭出しが終わって絵が出るまで待つ
  const deadline = performance.now() + 8000;
  while ([...document.querySelectorAll("video")].some((v) => v.readyState < 2 || v.seeking) && performance.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
  }
  for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r));
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
    elements: [...canvas.querySelectorAll<HTMLElement>("[data-gmm-el]")].map((el) => ({ kind: el.dataset.gmmEl!, rect: rect(el) })),
    texts: [...scene.querySelectorAll<HTMLElement>("[data-gmm-text]")].map((el) => ({
      text: (el.textContent ?? "").slice(0, 40),
      fontSize: parseFloat(getComputedStyle(el).fontSize),
      rect: rect(el),
      clipped: el.hasAttribute("data-gmm-clip") && el.scrollWidth > el.clientWidth + 1,
    })),
  };
}

/** 焼き込み字幕の行数と、部品との重なりを測る */
function measureSubtitle(): SubtitleMeasurement | null {
  const box = document.querySelector<HTMLElement>("[data-gmm-subtitle]");
  const text = document.querySelector<HTMLElement>("[data-gmm-subtitle-text]");
  const canvas = document.querySelector<HTMLElement>("[data-gmm-canvas]");
  if (!box || !text || !canvas) return null;
  const origin = canvas.getBoundingClientRect();
  const r = box.getBoundingClientRect();
  return {
    text: text.textContent ?? "",
    lines: Math.round(text.getBoundingClientRect().height / parseFloat(getComputedStyle(text).lineHeight)),
    rect: { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height },
  };
}

declare global {
  interface Window {
    gmm: { show: typeof show; measure: typeof measure; measureSubtitle: typeof measureSubtitle };
  }
}
window.gmm = { show, measure, measureSubtitle };
