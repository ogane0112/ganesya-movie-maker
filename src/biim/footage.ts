// ゲーム実況の録画を扱う：大きさ・長さを調べる、public/ に置く、下見用のコマ一覧を作る。
import { existsSync } from "node:fs";
import { copyFile, link, mkdir, readdir, rm, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { ffmpeg, ffmpegLog } from "../ffmpeg.js";

export type Probe = { width: number; height: number; duration: number; hasAudio: boolean };

export async function probeVideo(file: string): Promise<Probe> {
  if (!existsSync(file)) throw new Error(`録画ファイルがありません: ${file}`);
  const log = await ffmpegLog(["-i", file, "-t", "0", "-f", "null", "-"]);
  const d = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const v = log.match(/Stream #[^\n]*Video:[^\n]*?, (\d{2,5})x(\d{2,5})[ ,\[]/);
  if (!d || !v) throw new Error(`録画の大きさ・長さを読めませんでした: ${file}`);
  return {
    duration: Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]),
    width: Number(v[1]),
    height: Number(v[2]),
    hasAudio: /Stream #[^\n]*Audio:/.test(log),
  };
}

/** 録画を public/footage/ に置く（同じディスクならハードリンクで、コピーしない）。public からの相対パスを返す */
export async function placeFootage(file: string, outDir: string): Promise<string> {
  const s = await stat(file);
  const name = `footage/${basename(file, extname(file))}-${s.size}-${Math.floor(s.mtimeMs)}${extname(file).toLowerCase()}`;
  const dest = join(outDir, "public", name);
  if (!existsSync(dest)) {
    await mkdir(join(outDir, "public/footage"), { recursive: true });
    await rm(dest, { force: true });
    await link(file, dest).catch(() => copyFile(file, dest));
  }
  return name;
}

export type FootageOverview = { probe: Probe; sheets: string[]; every: number; blacks: [number, number][] };

/**
 * F19: 録画の下見。every 秒ごとのコマを時刻付きで 4×3 の一覧画像（1枚 = 12コマ）にし、
 * 暗転している区間（ロードの候補）を調べる。AI はこの一覧を見て実況の下書きを書く。
 */
export async function overviewFootage(file: string, outDir: string, opts: { every: number; from?: number; to?: number }): Promise<FootageOverview> {
  const probe = await probeVideo(file);
  const dir = join(outDir, "footage");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const range = [...(opts.from ? ["-ss", String(opts.from)] : []), ...(opts.to ? ["-to", String(opts.to)] : [])];
  const font = await findFont();
  // 時刻は録画の先頭からの秒（-ss で途中から切り出しても元の時刻を出す）
  const label = font
    ? `,drawtext=fontfile='${font}':text='%{pts\\:hms\\:${opts.from ?? 0}}':x=10:y=h-th-12:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=6`
    : "";
  await ffmpeg([...range, "-i", file, "-vf", `fps=1/${opts.every},scale=480:-2${label},tile=4x3:padding=6:color=0x222222`, "-an", join(dir, "sheet-%02d.png")]);
  const sheets = (await readdir(dir)).filter((f) => f.startsWith("sheet-")).sort().map((f) => join(dir, f));
  return { probe, sheets, every: opts.every, blacks: await findBlack(file, range) };
}

/** 画面が暗転している区間（0.5秒以上）。ロード画面の候補 */
async function findBlack(file: string, range: string[]): Promise<[number, number][]> {
  const log = await ffmpegLog([...range, "-i", file, "-vf", "blackdetect=d=0.5:pix_th=0.10", "-an", "-f", "null", "-"]);
  const offset = range[0] === "-ss" ? Number(range[1]) : 0;
  return [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]) + offset, Number(m[2]) + offset]);
}

async function findFont(): Promise<string | undefined> {
  const candidates = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"];
  return candidates.find((f) => existsSync(f));
}
