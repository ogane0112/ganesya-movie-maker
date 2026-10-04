// :::custom の場面のコード（TSX）を、Remotion と検査用ページのバンドルに入れる。
// 書き出しのたびに build/<台本名>/custom-scenes.tsx（登録表）を作り、バンドラでモジュール名 "gmm-custom-scenes" をそこへ向ける。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SceneDoc } from "../schema.js";
import { customId } from "./timeline.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** 同じ台本なら同じ動画になるように、場面のコードで使ってはいけないもの */
const FORBIDDEN: [RegExp, string][] = [
  [/Math\.random\s*\(/, "Math.random()（random(seed) を使う）"],
  [/Date\.now\s*\(|new Date\s*\(/, "現在時刻（Date）"],
  [/performance\.now\s*\(/, "performance.now()"],
  [/\bfetch\s*\(/, "fetch()（ネットから読まない。素材は手元に置く）"],
];

/** 場面のコードの決まりを守っているか（問題の一覧を返す） */
export function lintCustomScene(source: string, label: string): string[] {
  const problems: string[] = [];
  for (const [re, what] of FORBIDDEN) if (re.test(source)) problems.push(`${label}: ${what} は使えません`);
  if (!/export\s+default\b/.test(source)) problems.push(`${label}: export default で部品（React コンポーネント）を書き出してください`);
  return problems;
}

/** 台本の :::custom を集めて登録表を書く。返り値は登録表のパス */
export async function writeCustomRegistry(doc: SceneDoc, scriptPath: string, outDir: string): Promise<string> {
  const srcs = [...new Set(doc.scenes.flatMap((s) => (s.motion ?? []).filter((e) => e.type === "custom").map((e) => (e as { src: string }).src)))];
  const problems: string[] = [];
  const hash = createHash("sha1");
  const lines = ['import type { ComponentType } from "react";'];
  const entries: string[] = [];
  for (const [i, src] of srcs.entries()) {
    const file = resolve(dirname(scriptPath), src);
    if (!existsSync(file)) {
      problems.push(`場面のコードがありません: ${src}`);
      continue;
    }
    const code = await readFile(file, "utf8");
    problems.push(...lintCustomScene(code, src));
    hash.update(src).update(code);
    lines.push(`import C${i} from ${JSON.stringify(file)};`);
    entries.push(`  ${JSON.stringify(customId(src))}: C${i} as ComponentType<any>,`);
  }
  if (problems.length) throw new Error(`:::custom の場面のコードに問題があります:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  const registry = join(outDir, "custom-scenes.tsx");
  await writeFile(registry, [...lines, "", "export const CUSTOM_SCENES: Record<string, ComponentType<any>> = {", ...entries, "};", ""].join("\n"));
  await writeFile(join(outDir, "custom-scenes.hash"), hash.digest("hex"));
  return registry;
}

/** バンドラに渡す別名（"gmm-custom-scenes" と "gmm-motion"） */
export function bundleAliases(outDir: string): Record<string, string> {
  // バンドラは作業ディレクトリから解決するので、絶対パスにする
  const registry = resolve(outDir, "custom-scenes.tsx");
  return {
    "gmm-custom-scenes": existsSync(registry) ? registry : join(root, "remotion/motion/no-custom-scenes.ts"),
    "gmm-motion": join(root, "remotion/motion/kit.ts"),
  };
}

export const nodeModulesDir = join(root, "node_modules");
