// gmm: 台本から解説動画を作るCLI（F12: まずはCLI。MCPはこの上に薄くかぶせる）
import { Command, Option } from "commander";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { captureFrames, runChecks } from "./inspect/index.js";
import { formatIssues } from "./inspect/rules.js";
import { ScriptError } from "./parse.js";
import { importPsd } from "./psd.js";
import { prepare, type PipelineOptions } from "./pipeline.js";
import { preview, renderVideo } from "./render.js";

// 進行状況は stderr、結果は stdout に出す（エージェントが stdout だけ読めばよいように）
const log = (msg: string) => process.stderr.write(`[gmm] ${msg}\n`);

const program = new Command()
  .name("gmm")
  .description("台本(Markdown)から解説動画を作る。タイミングはナレーション音声の長さで自動的に決まる。")
  .showHelpAfterError();

type Common = { out?: string; tts: PipelineOptions["tts"]; voicevoxUrl: string };

function withCommon(cmd: Command): Command {
  return cmd
    .argument("<input>", "台本(.md) または シーン定義JSON(.json)")
    .option("-o, --out <dir>", "出力ディレクトリ（既定: build/<台本名>）")
    .addOption(new Option("--tts <provider>", "音声合成").choices(["auto", "voicevox", "silent"]).default("auto"))
    .option("--voicevox-url <url>", "VOICEVOX エンジンのURL", process.env.VOICEVOX_URL ?? "http://127.0.0.1:50021");
}

const pipelineOpts = (o: Common, requireVoice = false): PipelineOptions => ({
  out: o.out,
  tts: o.tts,
  voicevoxUrl: o.voicevoxUrl,
  log,
  requireVoice,
});

async function check(input: string, o: Common & { json?: boolean }, requireVoice = false) {
  const { timeline, outDir } = await prepare(input, pipelineOpts(o, requireVoice));
  const issues = await runChecks(timeline, outDir);
  await writeFile(join(outDir, "check.json"), JSON.stringify(issues, null, 2));
  console.log(o.json ? JSON.stringify(issues, null, 2) : formatIssues(issues));
  return { timeline, outDir, errors: issues.filter((i) => i.severity === "error").length };
}

withCommon(program.command("parse").description("F1: 台本をシーン定義JSONにする（音声も作る）")).action(async (input, o) => {
  const { outDir } = await prepare(input, pipelineOpts(o));
  console.log(join(outDir, "scenes.json"));
});

withCommon(program.command("check").description("F6: はみ出し・重なり・文字サイズ・情報量・表示時間を検査する（エラーがあれば終了コード1）"))
  .option("--json", "結果をJSONで出す")
  .action(async (input, o) => {
    const { errors } = await check(input, o);
    process.exitCode = errors ? 1 : 0;
  });

withCommon(program.command("frames").description("F7: シーンごとのキーフレームをPNGで書き出す（frames/overview.png で全体を一覧できる）"))
  .option("--steps", "ナレーション文ごとの途中経過も撮る")
  .option("--scene <ids...>", "撮るシーンを絞る（例: --scene s02 s03）")
  .action(async (input, o) => {
    const { timeline, outDir } = await prepare(input, pipelineOpts(o));
    const shots = await captureFrames(timeline, outDir, { mode: o.steps ? "steps" : "final", scenes: o.scene });
    for (const s of shots) console.log(`${join(outDir, s.file)}\t${s.label}`);
    if (!o.scene) console.log(`${join(outDir, "frames/overview.png")}\t全シーン一覧`);
  });

withCommon(program.command("render").description("F5: MP4 に書き出す（変わったシーンだけ作り直す）"))
  .option("--no-cache", "キャッシュを使わず全シーンを作り直す")
  .action(async (input, o) => {
    const { timeline, outDir } = await prepare(input, pipelineOpts(o, true));
    const output = join(outDir, "video.mp4");
    await renderVideo(timeline, outDir, output, log, { cache: o.cache });
    console.log(output);
  });

withCommon(program.command("preview").description("F5: Remotion Studio でプレビューする"))
  .option("--port <n>", "ポート番号", (v) => Number(v))
  .action(async (input, o) => {
    const { timeline, outDir } = await prepare(input, pipelineOpts(o));
    process.exitCode = await preview(timeline, outDir, o.port);
  });

withCommon(program.command("build").description("検査 → キーフレーム → MP4 を一度に行う。検査エラーがあれば MP4 は作らない"))
  .option("--force", "検査エラーがあっても MP4 を作る")
  .option("--no-render", "MP4 を作らない（検査とキーフレームだけ）")
  .action(async (input, o) => {
    const { timeline, outDir, errors } = await check(input, o, o.render);
    const shots = await captureFrames(timeline, outDir, { mode: "final" });
    console.log(`\nキーフレーム: ${join(outDir, "frames/overview.png")}（シーン別: ${shots.map((s) => s.file).join(", ")}）`);
    if (errors && !o.force) {
      console.log("検査エラーがあるため MP4 は作りませんでした。台本を直して gmm build をやり直してください。");
      process.exitCode = 1;
      return;
    }
    if (o.render) {
      const output = join(outDir, "video.mp4");
      await renderVideo(timeline, outDir, output, log);
      console.log(`動画: ${output}`);
    }
  });

program
  .command("character")
  .description("立ち絵の素材を扱う")
  .command("import")
  .description("F14: 立ち絵 PSD をレイヤーごとの PNG と layers.json に分解する（PSDTool 形式の * / ! に対応）")
  .argument("<psd>", "PSD ファイル")
  .argument("<dir>", "書き出し先（例: characters/zundamon）")
  .action(async (psd, dir) => {
    log("PSD を読み込み中…");
    const r = await importPsd(psd, dir);
    for (const l of r.layers) console.log(`${l.radio ? "*" : " "} ${l.path}`);
    console.log(`\n${r.layers.length}レイヤーを ${join(dir, "layers")} に書き出しました（${r.width}×${r.height}）。`);
    console.log(`${join(dir, "character.json")} で、表情ごとに使うレイヤーを上のパスで指定してください（README の「立ち絵」参照）。`);
  });

program.parseAsync().catch((e) => {
  if (e instanceof ScriptError) {
    console.error("台本にエラーがあります:\n" + e.problems.map((p) => `  - ${p}`).join("\n"));
  } else {
    console.error(e instanceof Error ? e.message : e);
  }
  process.exitCode = 2;
});
