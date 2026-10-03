// F13: テーマの解決。theme: に組み込み名（wakaba / dark）か JSON ファイルのパスを書く。
// JSON は {"extends": "wakaba", "accent": "#e07a5f", ...} のように、変えたい項目だけ書けばよい。
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { Theme, THEMES } from "../remotion/theme.js";

export async function loadTheme(spec: string, scriptPath: string, outDir: string, seen: string[] = []): Promise<Theme> {
  if (THEMES[spec]) return THEMES[spec];
  const file = [join(dirname(scriptPath), spec), spec, join("themes", spec), join("themes", `${spec}.json`)].find(
    (f) => f.endsWith(".json") && existsSync(f),
  );
  if (!file) {
    throw new Error(`テーマ「${spec}」がありません。組み込み（${Object.keys(THEMES).join(", ")}）か、テーマJSONのパスを書いてください`);
  }
  if (seen.includes(resolve(file))) throw new Error(`テーマの extends が循環しています: ${file}`);
  const raw = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown> & { extends?: string };
  const parent = await loadTheme(raw.extends ?? "wakaba", file, outDir, [...seen, resolve(file)]);
  const { extends: _, ...own } = raw;
  const merged = {
    ...parent,
    ...own,
    name: (own.name as string) ?? basename(file, ".json"),
    subtitle: { ...parent.subtitle, ...(own.subtitle as object) },
  };
  const parsed = Theme.safeParse(merged);
  if (!parsed.success) {
    throw new Error(`${file} が不正です: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
  }
  if (!own.fonts) return parsed.data; // フォントは親テーマのもの（コピー済み）を引き継ぐ
  // このテーマで指定したフォントファイルを public/fonts/ にコピーし、パスを public からの相対にする
  const fonts: Theme["fonts"] = [];
  for (const f of parsed.data.fonts) {
    const src = join(dirname(file), f.src);
    if (!existsSync(src)) throw new Error(`テーマのフォントがありません: ${src}`);
    await mkdir(join(outDir, "public/fonts"), { recursive: true });
    await copyFile(src, join(outDir, "public/fonts", basename(src)));
    fonts.push({ ...f, src: `fonts/${basename(src)}` });
  }
  return { ...parsed.data, fonts };
}
