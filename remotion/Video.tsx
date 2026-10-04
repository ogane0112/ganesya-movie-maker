import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/700.css";
import "@fontsource/noto-sans-jp/900.css";
import "@fontsource/jetbrains-mono/400.css";
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile } from "remotion";
import type { ResolvedElement, ResolvedScene, Timeline } from "../src/schema";
import type { Theme } from "./theme";
import { appearStyle, useAppear } from "./anim";
import { Character, DuoCast } from "./Character";
import { computeLayout, duoCharacters, type Layout } from "./layout";
import { BiimScene } from "./biim/BiimScene";
import { MotionScene } from "./motion/MotionScene";
import { Sound } from "./Sound";
import { Subtitle } from "./Subtitle";
import { Bullets } from "./parts/Bullets";
import { Code } from "./parts/Code";
import { Diagram } from "./parts/Diagram";
import { ImageView } from "./parts/Image";
import { MathBlock } from "./parts/Math";
import { TermCard } from "./parts/Term";
import { Text } from "./parts/Text";
import { Title } from "./parts/Title";

export type VideoProps = { timeline: Timeline; withAudio?: boolean };

/** フォント読み込み前のフレームを書き出さないようにする */
function useFontsReady() {
  const [handle] = useState(() => delayRender("フォント読み込み待ち"));
  useEffect(() => {
    requestAnimationFrame(() => {
      document.fonts.ready.then(() => continueRender(handle));
    });
  }, [handle]);
}

export const Video: React.FC<VideoProps> = ({ timeline, withAudio = true }) => {
  useFontsReady();
  const { theme } = timeline;
  const ch = timeline.character;
  // 部品が立ち絵・字幕に重ならないよう、右と下を空ける
  const layout = computeLayout(timeline);
  return (
    <AbsoluteFill
      data-gmm-canvas
      lang="ja"
      // 日本語を文節で折り返し（auto-phrase。lang="ja" が必要）、行の長さを揃える（balance）。「パー/ティション」のような泣き別れを防ぐ
      style={{ background: theme.background, fontFamily: theme.fontFamily, wordBreak: "auto-phrase" as never, textWrap: "balance" }}
    >
      {theme.fonts.length > 0 && (
        <style>
          {theme.fonts.map((f) => `@font-face{font-family:"${f.family}";src:url("${staticFile(f.src)}");font-weight:${f.weight};}`).join("\n")}
        </style>
      )}
      {timeline.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.start} durationInFrames={scene.durationInFrames} name={`${scene.id} ${scene.heading}`}>
          {timeline.run ? (
            <BiimScene scene={scene} timeline={timeline} withAudio={withAudio} />
          ) : timeline.motion ? (
            <MotionScene scene={scene} timeline={timeline} />
          ) : (
            <SceneView scene={scene} theme={theme} layout={layout} />
          )}
          {withAudio &&
            scene.sentences.map(
              (s, i) =>
                s.audio && (
                  <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames} layout="none">
                    <Audio src={staticFile(s.audio)} />
                  </Sequence>
                ),
            )}
        </Sequence>
      ))}
      {ch && <Character timeline={timeline} character={ch} />}
      {duoCharacters(timeline) && <DuoCast timeline={timeline} />}
      {withAudio && <Sound timeline={timeline} />}
      {layout.subtitle &&
        !timeline.run &&
        timeline.scenes.map((scene) => (
          <Sequence key={scene.id} from={scene.start} durationInFrames={scene.durationInFrames} layout="none">
            <Subtitle scene={scene} box={layout.subtitle!} theme={theme} cast={timeline.cast} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{ scene: ResolvedScene; theme: Theme; layout: Layout }> = ({ scene, theme, layout }) => {
  const head = useAppear(0, 12);
  return (
    <AbsoluteFill data-gmm-scene={scene.id} style={{ boxSizing: "border-box", padding: theme.padding, display: "flex", flexDirection: "column", gap: 56 }}>
      {scene.showHeading && (
        <div data-gmm-el="heading" style={{ ...appearStyle(head, -16), display: "flex", alignItems: "center", gap: 28, flex: "none" }}>
          <div style={{ width: 14, alignSelf: "stretch", borderRadius: 7, background: theme.accent }} />
          <div data-gmm-text style={{ fontSize: theme.fontSize * 1.2, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>
            {scene.heading}
          </div>
        </div>
      )}
      <div data-gmm-content style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 48, marginRight: layout.reserveRight, marginLeft: layout.reserveLeft, marginBottom: layout.reserveBottom }}>
        {scene.elements.map((el, i) => (
          <ElementView key={i} el={el} theme={theme} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ElementView: React.FC<{ el: ResolvedElement; theme: Theme }> = ({ el, theme }) => {
  switch (el.type) {
    case "title":
      return <Title title={el.title} subtitle={el.subtitle} from={el.from} theme={theme} />;
    case "bullets":
      return <Bullets items={el.items} theme={theme} />;
    case "code":
      return <Code lines={el.lines} background={el.background} lang={el.lang} from={el.from} highlights={el.highlights} theme={theme} />;
    case "text":
      return <Text html={el.html} variant={el.variant} from={el.from} theme={theme} />;
    case "math":
      return <MathBlock html={el.html} from={el.from} theme={theme} />;
    case "image":
      return <ImageView src={el.src} caption={el.caption} from={el.from} theme={theme} />;
    case "diagram":
      return <Diagram {...el} theme={theme} />;
    case "term":
      return <TermCard term={el.term} description={el.description} from={el.from} theme={theme} />;
  }
};
