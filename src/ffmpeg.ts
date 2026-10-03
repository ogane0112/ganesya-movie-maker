// ffmpeg を呼ぶ。PATH にあればそれを、なければ Remotion 同梱のもの（npx remotion ffmpeg）を使う。
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let command: [string, string[]] | undefined;

function resolveFfmpeg(): [string, string[]] {
  if (command) return command;
  const system = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  command = system.status === 0 ? ["ffmpeg", []] : [join(root, "node_modules/.bin/remotion"), ["ffmpeg"]];
  return command;
}

export async function ffmpeg(args: string[]): Promise<void> {
  await run(["-v", "error", "-y", ...args]);
}

/** ffmpeg を実行し、ログ（stderr）を返す。音量の測定などに使う */
export function ffmpegLog(args: string[]): Promise<string> {
  return run(["-hide_banner", "-nostats", ...args]);
}

function run(args: string[]): Promise<string> {
  const [cmd, pre] = resolveFfmpeg();
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [...pre, ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("exit", (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg が失敗しました: ${err.trim().slice(-2000)}`))));
  });
}

/** 曲全体の音の大きさ（統合ラウドネス, LUFS）と長さ（秒） */
export async function measureLoudness(file: string): Promise<{ lufs: number; seconds: number }> {
  const log = await ffmpegLog(["-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"]);
  const lufs = Number(log.match(/Integrated loudness:\s*I:\s*(-?[\d.]+) LUFS/)?.[1]);
  const d = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!Number.isFinite(lufs) || !d) throw new Error(`音の大きさを測れませんでした: ${file}`);
  return { lufs, seconds: Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) };
}
