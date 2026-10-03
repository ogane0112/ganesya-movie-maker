// 立ち絵 PSD のパーツを PNG に書き出す（gmm character import）。
// PSDTool の命名規則に従う: 名前が * で始まるレイヤーは「同じグループ内でどれか1つ」、! は「常に表示」。
// 書き出すのは画像を持つレイヤーだけ。どれも PSD と同じキャンバスサイズの PNG にするので、重ねるだけで元の位置になる。
import { initializeCanvas, readPsd, type Layer } from "ag-psd";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";

/** layers.json の1要素（下から上の順に並ぶ） */
export type PsdLayer = {
  /** PSD 内のパス。* と ! を除いた名前を / でつなぐ（例: 目/目セット/黒目/普通目） */
  path: string;
  file: string;
  /** * 付き。同じ親グループの別の * レイヤーと排他 */
  radio: boolean;
  blend: string;
  opacity: number;
};

export type LayersFile = { width: number; height: number; layers: PsdLayer[] };

// Canvas は使わない（画素は useImageData で受け取る）。ag-psd が要求するので ImageData だけ用意する
initializeCanvas(
  () => {
    throw new Error("canvas は使いません");
  },
  (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4), colorSpace: "srgb" }) as ImageData,
);

const clean = (name: string) => name.replace(/^[*!]/, "");

export async function importPsd(psdPath: string, outDir: string): Promise<LayersFile> {
  const psd = readPsd(await readFile(psdPath), { useImageData: true, skipCompositeImageData: true, skipThumbnail: true });
  const { width, height } = psd;
  await mkdir(join(outDir, "layers"), { recursive: true });

  const layers: PsdLayer[] = [];
  const walk = async (children: Layer[] | undefined, parent: string, opacity: number) => {
    // ag-psd の children は下から上の順
    for (const l of children ?? []) {
      const name = l.name ?? "";
      const path = parent ? `${parent}/${clean(name)}` : clean(name);
      const op = opacity * (l.opacity ?? 1);
      if (l.children) {
        await walk(l.children, path, op);
        continue;
      }
      if (!l.imageData || !l.imageData.width || !l.imageData.height) continue;
      const file = `layers/${String(layers.length).padStart(3, "0")}.png`;
      await writeFile(join(outDir, file), toFullCanvasPng(l, width, height));
      layers.push({
        path,
        file,
        radio: name.startsWith("*"),
        blend: l.blendMode && l.blendMode !== "normal" && l.blendMode !== "pass through" ? l.blendMode : "normal",
        opacity: Math.round(op * 1000) / 1000,
      });
    }
  };
  await walk(psd.children, "", 1);

  const result: LayersFile = { width, height, layers };
  await writeFile(join(outDir, "layers.json"), JSON.stringify(result, null, 2));
  return result;
}

function toFullCanvasPng(layer: Layer, width: number, height: number): Buffer {
  const img = layer.imageData!;
  const png = new PNG({ width, height });
  const left = layer.left ?? 0;
  const top = layer.top ?? 0;
  for (let y = 0; y < img.height; y++) {
    const ty = top + y;
    if (ty < 0 || ty >= height) continue;
    for (let x = 0; x < img.width; x++) {
      const tx = left + x;
      if (tx < 0 || tx >= width) continue;
      const s = (y * img.width + x) * 4;
      const d = (ty * width + tx) * 4;
      png.data[d] = img.data[s];
      png.data[d + 1] = img.data[s + 1];
      png.data[d + 2] = img.data[s + 2];
      png.data[d + 3] = img.data[s + 3];
    }
  }
  return PNG.sync.write(png);
}
