import { Composition } from "remotion";
import { Meta, type Timeline } from "../src/schema";
import { THEMES } from "./theme";
import { Video, type VideoProps } from "./Video";

import { COMPOSITION_ID } from "./constants";

// プレビュー時は --props で timeline を渡す。何も渡さないときの表示用。
const placeholder: Timeline = {
  meta: Meta.parse({ title: "placeholder" }),
  theme: THEMES.wakaba,
  audio: {},
  durationInFrames: 90,
  scenes: [
    {
      id: "s01",
      heading: "gmm preview",
      showHeading: false,
      start: 0,
      durationInFrames: 90,
      sentences: [],
      elements: [{ type: "title", title: "gmm preview 台本.md で開いてください", from: 0 }],
    },
  ],
};

export const Root: React.FC = () => (
  <Composition
    id={COMPOSITION_ID}
    component={Video as React.FC<VideoProps>}
    defaultProps={{ timeline: placeholder, withAudio: true } satisfies VideoProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, props.timeline.durationInFrames),
      fps: props.timeline.meta.fps,
      width: props.timeline.meta.width,
      height: props.timeline.meta.height,
    })}
    durationInFrames={90}
    fps={30}
    width={1920}
    height={1080}
  />
);
