// 外部の読み上げソフト（AquesTalk・SofTalk・OS の読み上げなど）を声として使う。
// 台本の声に exec:<名前> と書くと、利用者の設定ファイルに書いたコマンドで WAV を作る。
// 設定ファイルは利用者が自分で置くもの（台本やリポジトリからコマンドを実行させないため）：
//   環境変数 GMM_VOICES のパス、なければ ~/.config/gmm/voices.json
//   { "reimu": { "command": ["AquesTalkPlayer", "/T", "{text}", "/W", "{out}"], "credit": "AquesTalk" } }
// {text} は読み上げる文、{out} は書き出す WAV のパスに置き換わる。シェルは通さない。
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { ffmpeg } from "../ffmpeg.js";

export const ExternalVoice = z.object({
  command: z.array(z.string()).min(1),
  /** クレジット表記（credits.txt に書く） */
  credit: z.string().optional(),
});
export type ExternalVoice = z.infer<typeof ExternalVoice>;

export function voicesConfigPath(): string {
  return process.env.GMM_VOICES ?? join(homedir(), ".config/gmm/voices.json");
}

export async function loadExternalVoice(name: string): Promise<ExternalVoice> {
  const file = voicesConfigPath();
  if (!existsSync(file)) {
    throw new Error(`声「exec:${name}」を使うには ${file} にコマンドを書いてください（docs/skit.md の「外部の読み上げソフト」）`);
  }
  const all = z.record(z.string(), ExternalVoice).safeParse(JSON.parse(await readFile(file, "utf8")));
  if (!all.success) throw new Error(`${file} が不正です: ${all.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
  const v = all.data[name];
  if (!v) throw new Error(`${file} に声「${name}」がありません（あるのは ${Object.keys(all.data).join(", ") || "なし"}）`);
  return v;
}

/** コマンドで読み上げ、ffmpeg で 24kHz・16bit・モノラルの WAV にそろえて返す */
export async function externalSynthesize(voice: ExternalVoice, text: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "gmm-voice-"));
  try {
    const raw = join(dir, "raw.wav");
    const args = voice.command.map((a) => a.replaceAll("{text}", text).replaceAll("{out}", raw));
    await new Promise<void>((resolve, reject) => {
      const child = spawn(args[0], args.slice(1), { stdio: ["ignore", "ignore", "pipe"] });
      let err = "";
      child.stderr.on("data", (d) => (err += d));
      child.on("error", (e) => reject(new Error(`読み上げのコマンド ${args[0]} を起動できません: ${e.message}`)));
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`読み上げのコマンドが失敗しました（${code}）: ${err.trim().slice(0, 300)}`))));
    });
    if (!existsSync(raw)) throw new Error(`読み上げのコマンドが ${"{out}"} に音声を書きませんでした: ${voice.command.join(" ")}`);
    const out = join(dir, "out.wav");
    await ffmpeg(["-i", raw, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", out]);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
