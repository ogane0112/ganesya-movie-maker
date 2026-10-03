import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { isBlinking, characterState } from "../remotion/Character";
import { loadCharacter } from "../src/character";
import { parseScript } from "../src/parse";
import type { Timeline } from "../src/schema";
import { mouthFromQuery } from "../src/tts/voicevox";

const png = () => PNG.sync.write(new PNG({ width: 100, height: 200 }));

/** PSD から書き出した形の立ち絵ディレクトリを作る */
async function fixture(character: object) {
  const dir = await mkdtemp(join(tmpdir(), "gmm-ch-"));
  const names = ["体", "腕/基本", "腕/考える", "目/開き", "目/閉じ", "口/閉じ", "口/開き", "眉/普通", "眉/困り"];
  await mkdir(join(dir, "ch/layers"), { recursive: true });
  const layers = [];
  for (const [i, path] of names.entries()) {
    const file = `layers/${i}.png`;
    await writeFile(join(dir, "ch", file), png());
    layers.push({ path, file, radio: path.includes("/"), blend: "normal", opacity: 1 });
  }
  await writeFile(join(dir, "ch/layers.json"), JSON.stringify({ width: 100, height: 200, layers }));
  await writeFile(join(dir, "ch/character.json"), JSON.stringify({ name: "テスト", layersFile: "layers.json", ...character }));
  return dir;
}

const def = {
  height: 400,
  base: ["体", "腕/基本"],
  eyes: ["目/開き"],
  blink: ["目/閉じ"],
  mouth: ["口/閉じ"],
  open: ["口/開き"],
  expressions: { normal: { layers: ["眉/普通"] }, think: { layers: ["眉/困り", "腕/考える"] } },
};

describe("loadCharacter", () => {
  it("表情ごとに4状態のレイヤーを PSD の重なり順で作り、* 付きは base を差し替える", async () => {
    const dir = await fixture(def);
    const doc = parseScript(`---\ncharacter: ${join(dir, "ch")}\n---\n## A\n\n{face:think}考えます。\n`);
    const ch = await loadCharacter(doc, join(dir, "a.md"), join(dir, "out"));
    if (ch?.kind !== "layers") throw new Error();
    expect(ch.width).toBe(200); // 高さ400 × 縦横比 1:2
    const names = (idx: number[]) => idx.map((i) => ch.layers[i].src.split("/").pop());
    // 使ったレイヤーだけを 000.png から詰めてコピーする（腕/基本・腕/考える・目/閉じ…）
    expect(ch.layers).toHaveLength(9);
    const src = ["体", "腕/基本", "腕/考える", "目/開き", "目/閉じ", "口/閉じ", "口/開き", "眉/普通", "眉/困り"];
    const label = (idx: number[]) => names(idx).map((n) => src[Number(n!.slice(0, 3))]);
    expect(label(ch.expressions.normal.closed)).toEqual(["体", "腕/基本", "目/開き", "口/閉じ", "眉/普通"]);
    expect(label(ch.expressions.normal.blinkOpen)).toEqual(["体", "腕/基本", "目/閉じ", "口/開き", "眉/普通"]);
    expect(label(ch.expressions.think.open)).toEqual(["体", "腕/考える", "目/開き", "口/開き", "眉/困り"]);
  });

  it("ない表情・ないレイヤーを報告する", async () => {
    const dir = await fixture(def);
    const doc = parseScript(`---\ncharacter: ${join(dir, "ch")}\n---\n## A\n\n{face:smile}笑います。\n`);
    await expect(loadCharacter(doc, join(dir, "a.md"), join(dir, "out"))).rejects.toThrow("にない表情が指定されています: smile");
    const dir2 = await fixture({ ...def, expressions: { normal: { layers: ["眉/ない"] } } });
    const doc2 = parseScript(`---\ncharacter: ${join(dir2, "ch")}\n---\n## A\n\n文。\n`);
    await expect(loadCharacter(doc2, join(dir2, "a.md"), join(dir2, "out"))).rejects.toThrow("レイヤー「眉/ない」がありません");
  });
});

describe("口パク・まばたき", () => {
  it("母音の区間を口を開ける区間にし、実際の音声の長さに合わせる", () => {
    const mora = (c: number | null, v: string, l: number) => ({ consonant_length: c, vowel: v, vowel_length: l });
    const q = {
      speedScale: 1,
      prePhonemeLength: 0.1,
      postPhonemeLength: 0.1,
      accent_phrases: [{ moras: [mora(0.1, "a", 0.2), mora(null, "N", 0.1), mora(0.1, "i", 0.2)], pause_mora: mora(null, "pau", 0.3) }],
    };
    // 予測 0.1+0.1+0.2+0.1+0.1+0.2+0.3+0.1 = 1.2 秒
    expect(mouthFromQuery(q, 1.2)).toEqual([
      [0.2, 0.4],
      [0.6, 0.8],
    ]);
    expect(mouthFromQuery(q, 2.4)).toEqual([
      [0.4, 0.8],
      [1.2, 1.6],
    ]);
  });

  it("まばたきは決まった間隔で数フレームだけ", () => {
    const frames = Array.from({ length: 300 }, (_, f) => isBlinking(f, 30));
    expect(frames.filter(Boolean).length).toBe(8); // 96 と 228 フレーム目の手前 4 フレームずつ
    expect(frames.slice(92, 96).every(Boolean)).toBe(true);
  });

  it("表情は文をまたいで引き継ぎ、口は区間の中だけ開く", () => {
    const t = {
      meta: { fps: 30 },
      character: { defaultFace: "normal" },
      scenes: [
        {
          start: 0,
          sentences: [
            { from: 10, durationInFrames: 20, face: "smile", mouth: [[12, 15]] },
            { from: 40, durationInFrames: 20, mouth: [] },
          ],
        },
        { start: 70, sentences: [{ from: 5, durationInFrames: 20, face: "think", mouth: [] }] },
      ],
    } as unknown as Timeline;
    expect(characterState(t, 0).face).toBe("normal");
    expect(characterState(t, 13)).toMatchObject({ face: "smile", mouthOpen: true, speaking: true });
    expect(characterState(t, 16).mouthOpen).toBe(false);
    expect(characterState(t, 45).face).toBe("smile");
    expect(characterState(t, 72)).toMatchObject({ face: "smile", speaking: false });
    expect(characterState(t, 76).face).toBe("think");
  });
});
