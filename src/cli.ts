// gmm: 台本から動画を作るCLI（F12: エージェントは CLI を直接使う。手順は .claude/skills/ のスキル）
import { Command, Option } from "commander";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { captureFrames, runChecks } from "./inspect/index.js";
import { formatIssues } from "./inspect/rules.js";
import { ScriptError } from "./parse.js";
import { importPsd } from "./psd.js";
import { findTermCandidates } from "./terms.js";
import { cachePath, fetchTrack, findTrack, loadCatalogs } from "./bgm.js";
import { existsSync } from "node:fs";
import { defaultOutDir, loadSceneDoc, prepare, type PipelineOptions } from "./pipeline.js";
import { overviewFootage } from "./biim/footage.js";
import { formatTime, parseTime } from "./biim/parse.js";
import { preview, renderVideo } from "./render.js";
import { marpToScript } from "./marp.js";

// head などに渡して途中で閉じられても落ちないようにする
process.stdout.on("error", (e: NodeJS.ErrnoException) => {
  if (e.code === "EPIPE") process.exit(0);
  throw e;
});

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
  .command("footage")
  .description("F19: 録画を下見する。N秒ごとのコマを時刻付きの一覧画像にし、暗転（ロード）の区間を !cut の候補として出す")
  .argument("<video>", "録画ファイル")
  .option("-o, --out <dir>", "出力ディレクトリ（既定: build/<録画名>）")
  .option("--every <sec>", "何秒ごとにコマを取るか", (v) => Number(v), 5)
  .option("--from <time>", "ここから（例: 1:30）")
  .option("--to <time>", "ここまで")
  .action(async (video, o) => {
    const out = o.out ?? defaultOutDir(video);
    const r = await overviewFootage(video, out, {
      every: o.every,
      from: o.from === undefined ? undefined : parseTime(o.from),
      to: o.to === undefined ? undefined : parseTime(o.to),
    });
    console.log(`録画: ${r.probe.width}x${r.probe.height} / ${formatTime(r.probe.duration)}${r.probe.hasAudio ? "" : "（音なし）"}`);
    console.log(`\nコマの一覧（${r.every}秒ごと・1枚12コマ。各コマの左上が録画の時刻）:`);
    for (const f of r.sheets) console.log(`  ${f}`);
    console.log(r.blacks.length ? "\n暗転している区間（ロードなら台本に貼る）:" : "\n暗転している区間はありません");
    for (const [a, b] of r.blacks) console.log(`  !cut ${formatTime(a)}-${formatTime(b)}`);
  });

program
  .command("terms")
  .description("専門用語の候補（カタカナ語・英字の語）を一覧する。glossary: に入れる用語を選ぶ手がかり")
  .argument("<input>", "台本(.md) または シーン定義JSON(.json)")
  .action(async (input) => {
    const doc = await loadSceneDoc(input);
    console.log("回数\t初出\tglossary\t説明\t語");
    for (const c of findTermCandidates(doc)) {
      console.log(`${c.count}\t${c.firstScene}\t${c.inGlossary ? "○" : "-"}\t${c.explained ? "○" : "-"}\t${c.word}`);
    }
    const missing = Object.keys(doc.meta.glossary).filter((t) => !findTermCandidates(doc).some((c) => c.word === t));
    if (missing.length) console.log(`\n（glossary にあるが上に出ない語: ${missing.join("、")}。漢字を含む語は gmm check で確かめてください）`);
  });

program
  .command("marp")
  .description("F11: Marp スライドを台本の下書きにする（1枚 = 1シーン。発表者ノートがナレーションになる）")
  .argument("<slides>", "Marp のスライド（.md）")
  .option("-o, --out <file>", "書き出す台本（既定: <スライド名>-video.md）")
  .option("--voice <voice>", "声", "zundamon")
  .option("--character <character>", "立ち絵", "zundamon")
  .option("--force", "台本がすでにあっても上書きする")
  .action(async (slides: string, o: { out?: string; voice: string; character: string; force?: boolean }) => {
    const out = o.out ?? join(dirname(slides), `${basename(slides, extname(slides))}-video.md`);
    if (existsSync(out) && !o.force) throw new Error(`${out} はすでにあります（上書きするなら --force）`);
    const r = marpToScript(await readFile(slides, "utf8"), {
      voice: o.voice,
      character: o.character,
      // 画像はスライドからの相対パス → 台本からの相対パス
      imagePath: (src) => (/^(https?:|data:|\/)/.test(src) ? src : relative(dirname(resolve(out)), resolve(dirname(slides), src)) || src),
    });
    await writeFile(out, r.script);
    console.log(out);
    log(`${r.slides}枚 → ${r.scenes}シーン（うち ${r.drafted}シーンは発表者ノートがなく、ナレーションが仮のもの）`);
    for (const t of r.todos) log(`要確認: ${t}`);
    log("次: ナレーションを話し言葉に直す → gmm terms で用語を洗い出す → gmm check");
  });

const bgm = program.command("bgm").description("BGM のカタログ（bgm/*.json）を扱う");

bgm
  .command("list")
  .description("BGM の候補を、雰囲気・合う場面つきで一覧する。台本の bgm: に書く名前（maou:acoustic50 など）もここに出る")
  .option("--tag <tag>", "タグで絞り込む（例: 落ち着き）")
  .option("--json", "JSON で出す")
  .action(async (o) => {
    const tracks = (await loadCatalogs()).filter((t) => !o.tag || t.tags.includes(o.tag));
    const rows = tracks.map((t) => ({ ...t, name: `${t.catalog}:${t.id}`, downloaded: existsSync(cachePath(t)) }));
    if (o.json) return console.log(JSON.stringify(rows, null, 2));
    for (const t of rows) {
      console.log(`${t.name}${t.title ? `「${t.title}」` : ""}  [${t.tags.join("・")}]${t.downloaded ? "  (取得済み)" : ""}${t.heard ? "  (試聴済み)" : ""}`);
      console.log(`    ${t.description}`);
      if (t.fit) console.log(`    合う場面: ${t.fit}`);
    }
    const tags = [...new Set((await loadCatalogs()).flatMap((t) => t.tags))];
    console.log(`\n${rows.length}曲。タグ: ${tags.join(" ")}`);
    console.log("台本のフロントマターに bgm: <名前> と書く。クレジットは credits.txt に自動で出る");
  });

bgm
  .command("fetch")
  .description("カタログの曲を bgm/cache/ に取ってくる（render のときにも自動で取る）")
  .argument("<names...>", "曲の名前（例: maou:acoustic50）")
  .action(async (names: string[]) => {
    for (const name of names) {
      const t = await findTrack(name);
      if (!t) throw new Error(`「${name}」はカタログの名前ではありません（例: maou:acoustic50）`);
      console.log(`${name}\t${await fetchTrack(t)}`);
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
