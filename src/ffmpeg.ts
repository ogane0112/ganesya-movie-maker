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

export function ffmpeg(args: string[]): Promise<void> {
  const [cmd, pre] = resolveFfmpeg();
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [...pre, "-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg が失敗しました: ${err.trim()}`))));
  });
}
