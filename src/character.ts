// F14: 立ち絵の読み込み。
//   character: none      立ち絵なし
//   character: builtin   組み込みキャラ（SVG。素材なしで動く）
//   character: <名前>    台本と同じ場所かカレントの characters/<名前>/character.json
//   character: <パス>    character.json のあるディレクトリ
//
// 立ち絵はレイヤー（同じ大きさの透過 PNG）を重ねて作る。PSD は gmm character import でレイヤーに分解できる。
// 表示するレイヤー = base + 表情の layers + 目（まばたき中は blink、それ以外は eyes）+ 口（口パク中は open、それ以外は mouth）
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { z } from "zod";
import { BUILTIN_CHARACTER, BUILTIN_FACES, BUILTIN_PALETTES } from "../remotion/builtinCharacter.js";
import type { LayersFile } from "./psd.js";
import type { CastMember, CharacterLayer, CharacterStates, ResolvedCharacter, SceneDoc } from "./schema.js";

const Parts = z.array(z.string());
const PartSet = z.object({
  /** 表情固有のレイヤー（眉・ほお・腕など） */
  layers: Parts.optional(),
  /** 目を開けているとき / まばたき中 */
  eyes: Parts.optional(),
  blink: Parts.optional(),
  /** 口を閉じているとき / 口パクで開けたとき */
  mouth: Parts.optional(),
  open: Parts.optional(),
});

/** characters/<名前>/character.json の仕様 */
export const CharacterFile = PartSet.extend({
  name: z.string(),
  /** クレジット表記（例: 立ち絵：坂本アヒル） */
  credit: z.string().optional(),
  /** gmm character import が作る layers.json。省略時はレイヤー名を PNG のファイル名として扱う */
  layersFile: z.string().optional(),
  /** 元画像のうち表示する範囲（px）。省略時は全体 */
  crop: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
  /** 画面上の高さ（px, 1080p 換算） */
  height: z.number().default(640),
  /** 顔の中心（元画像の px）。ゲーム実況の円の中に顔を合わせるのに使う。省略時は表示範囲の上のほうの中央 */
  face: z.object({ x: z.number(), y: z.number() }).optional(),
  default: z.string().default("normal"),
  /** すべての表情に共通のレイヤー（体・服など） */
  base: Parts.default([]),
  /** 表情名 → 差分。省略した項目（eyes / blink / mouth / open）は上の既定値を使う */
  expressions: z.record(z.string(), PartSet),
});
export type CharacterFile = z.infer<typeof CharacterFile>;

export async function loadCharacter(doc: SceneDoc, scriptPath: string, outDir: string): Promise<ResolvedCharacter | undefined> {
  const faces = doc.scenes.flatMap((s) => s.sentences.map((x) => x.face));
  return loadCharacterSpec(doc.meta.character, faces, scriptPath, outDir);
}

/** 掛け合いの話者ごとの声・立ち絵・字幕の色（speakers: と characters:） */
export async function loadCast(doc: SceneDoc, scriptPath: string, outDir: string): Promise<CastMember[]> {
  const names = Object.keys(doc.meta.speakers);
  const cast: CastMember[] = [];
  for (const [i, name] of names.entries()) {
    const spec = doc.meta.characters[name] ?? "none";
    const faces = doc.scenes.flatMap((s) => s.sentences.filter((x) => x.speaker === name).map((x) => x.face));
    const character = await loadCharacterSpec(spec, faces, scriptPath, outDir).catch((e: Error) => {
      throw new Error(`話者「${name}」の立ち絵: ${e.message}`);
    });
    const palette = BUILTIN_PALETTES[spec as keyof typeof BUILTIN_PALETTES];
    cast.push({ name, color: palette?.hairDark ?? CAST_COLORS[i % CAST_COLORS.length], character });
  }
  return cast;
}

/** 字幕の話者名の色（立ち絵が組み込みでないとき） */
const CAST_COLORS = ["#3a7a37", "#b0437f", "#335f96", "#b06a1c"];

async function loadCharacterSpec(
  spec: string,
  usedFaces: (string | undefined)[],
  scriptPath: string,
  outDir: string,
): Promise<ResolvedCharacter | undefined> {
  if (spec === "none") return undefined;

  let character: ResolvedCharacter;
  let faces: string[];
  if (spec in BUILTIN_PALETTES) {
    const palette = BUILTIN_PALETTES[spec as keyof typeof BUILTIN_PALETTES];
    character = { kind: "builtin", ...BUILTIN_CHARACTER, name: palette.name, variant: spec };
    faces = [...BUILTIN_FACES];
  } else {
    const dir = [spec, join(dirname(scriptPath), "characters", spec), join("characters", spec)].find((d) =>
      existsSync(join(d, "character.json")),
    );
    if (!dir) {
      throw new Error(`立ち絵「${spec}」が見つかりません。characters/${spec}/character.json を置くか、character: builtin を使ってください`);
    }
    const file = join(dir, "character.json");
    const parsed = CharacterFile.safeParse(JSON.parse(await readFile(file, "utf8")));
    if (!parsed.success) {
      throw new Error(`${file} が不正です: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
    }
    const def = parsed.data;
    faces = Object.keys(def.expressions);
    if (!def.expressions[def.default]) throw new Error(`立ち絵「${def.name}」に既定の表情「${def.default}」がありません`);
    character = await resolveLayers(def, dir, outDir);
  }

  const unknown = new Set(usedFaces.filter((f): f is string => !!f && !faces.includes(f)));
  if (unknown.size) {
    throw new Error(`立ち絵「${character.name}」にない表情が指定されています: ${[...unknown].join(", ")}（使えるのは ${faces.join(", ")}）`);
  }
  return character;
}

type SourceLayer = { name: string; file: string; radio: boolean; blend: string; opacity: number };

async function resolveLayers(def: CharacterFile, dir: string, outDir: string): Promise<ResolvedCharacter> {
  // 使えるレイヤーの一覧（下から上の順）
  let source: SourceLayer[];
  let canvas: { width: number; height: number };
  if (def.layersFile) {
    const lf = JSON.parse(await readFile(join(dir, def.layersFile), "utf8")) as LayersFile;
    source = lf.layers.map((l) => ({ name: l.path, file: l.file, radio: l.radio, blend: l.blend, opacity: l.opacity }));
    canvas = { width: lf.width, height: lf.height };
  } else {
    // PNG を直接並べる形式。重なり順は登場順
    const names = [def.base, def.layers, def.eyes, def.blink, def.mouth, def.open, ...Object.values(def.expressions).flatMap((e) => [e.layers, e.eyes, e.blink, e.mouth, e.open])]
      .flatMap((x) => x ?? []);
    source = [...new Set(names)].map((name) => ({ name, file: name, radio: false, blend: "normal", opacity: 1 }));
    if (!source.length) throw new Error(`立ち絵「${def.name}」にレイヤーがありません`);
    const first = join(dir, source[0].file);
    if (!existsSync(first)) throw new Error(`立ち絵の画像がありません: ${first}`);
    canvas = pngSize(await readFile(first));
  }
  const index = new Map(source.map((l, i) => [l.name, i]));
  const lookup = (name: string) => {
    const i = index.get(name);
    if (i === undefined) throw new Error(`立ち絵「${def.name}」にレイヤー「${name}」がありません`);
    return i;
  };
  const parent = (i: number) => source[i].name.split("/").slice(0, -1).join("/");

  // 表情ごとに4状態のレイヤー集合を作る
  const used = new Set<number>();
  const expressions: Record<string, CharacterStates> = {};
  for (const [face, e] of Object.entries(def.expressions)) {
    const pick = (k: "eyes" | "blink" | "mouth" | "open") => (e[k] ?? def[k] ?? []).map(lookup);
    const own = [...(def.layers ?? []), ...(e.layers ?? [])].map(lookup);
    // PSDTool と同じく、* 付きレイヤーを指定したら同じグループの base のレイヤーは外す（腕の差し替えなど）
    const replaced = new Set(own.filter((i) => source[i].radio).map(parent));
    const base = def.base.map(lookup).filter((i) => !(source[i].radio && replaced.has(parent(i))));
    const eyes = pick("eyes");
    const blink = e.blink ?? def.blink ? pick("blink") : eyes; // まばたき差分がなければ目はそのまま
    const make = (...groups: number[][]) => {
      const set = [...new Set(groups.flat())].sort((a, b) => a - b);
      set.forEach((i) => used.add(i));
      return set;
    };
    expressions[face] = {
      closed: make(base, own, eyes, pick("mouth")),
      open: make(base, own, eyes, pick("open")),
      blink: make(base, own, blink, pick("mouth")),
      blinkOpen: make(base, own, blink, pick("open")),
    };
  }

  // 使うレイヤーだけ public/ にコピーし、添字を詰め直す
  const pub = join("characters", basename(resolve(dir)));
  await mkdir(join(outDir, "public", pub), { recursive: true });
  const order = [...used].sort((a, b) => a - b);
  const remap = new Map(order.map((src, dst) => [src, dst]));
  const layers: CharacterLayer[] = [];
  for (const i of order) {
    const from = join(dir, source[i].file);
    if (!existsSync(from)) throw new Error(`立ち絵の画像がありません: ${from}（PSD なら gmm character import をやり直してください）`);
    const name = `${String(layers.length).padStart(3, "0")}.png`;
    await copyFile(from, join(outDir, "public", pub, name));
    layers.push({ src: `${pub}/${name}`, blend: source[i].blend, opacity: source[i].opacity });
  }
  for (const states of Object.values(expressions)) {
    for (const k of Object.keys(states) as (keyof CharacterStates)[]) states[k] = states[k].map((i) => remap.get(i)!);
  }

  const crop = def.crop ?? { x: 0, y: 0, ...canvas };
  return {
    kind: "layers",
    name: def.name,
    credit: def.credit,
    height: def.height,
    width: Math.round((def.height * crop.width) / crop.height),
    defaultFace: def.default,
    canvas,
    crop,
    layers,
    expressions,
    ...(def.face && { face: def.face }),
  };
}

function pngSize(buf: Buffer): { width: number; height: number } {
  if (buf.toString("ascii", 1, 4) !== "PNG") throw new Error("立ち絵の画像は PNG にしてください");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
