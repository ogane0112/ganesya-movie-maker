// F18: ゲーム実況（biim システム）の台本パーサ。
//
//   ---                     フロントマター（layout: biim / video / runStart / runEnd / speakers / characters …）
//   !cut 0:50-0:54          録画のこの区間を切る（ロードなど）
//   !fast 1:10-1:30 x4      この区間を 4 倍速にする
//   @0:00                   ここから下の発言を、録画のこの時刻に始める
//   ずんだもん: 発言         話者: 発言（話者は speakers: の名前。省略すると直前の話者）
//   ## 1-1 @0:06            区間（スプリット）。録画のこの時刻から始まる
//
// 発言は前の発言が終わるまで待つので、@ の時刻より遅れることがある（遅れすぎは gmm check が知らせる）。
import { parseFrontMatter, ScriptError, splitSentences, takeSentenceMarkers } from "../parse.js";
import { SceneDoc, type Edit, type Scene } from "../schema.js";

/** "1:23.45" / "1:02:03" / "83.5" → 秒 */
export function parseTime(s: string | number): number {
  if (typeof s === "number") return s;
  const parts = s.trim().split(":");
  if (!parts.every((p) => /^\d+(\.\d+)?$/.test(p)) || parts.length > 3) throw new Error(`時刻の書き方が不正です: ${s}（例: 1:23.4）`);
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export function formatTime(sec: number, digits = 1): string {
  const sign = sec < 0 ? "-" : "";
  const t = Math.abs(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor(t / 60) % 60;
  const ss = (t % 60).toFixed(digits).padStart(digits ? 3 + digits : 2, "0");
  return h ? `${sign}${h}:${String(m).padStart(2, "0")}:${ss}` : `${sign}${m}:${ss}`;
}

const TIME = String.raw`\d+(?::\d+){0,2}(?:\.\d+)?`;

export function parseBiimScript(source: string): SceneDoc {
  const problems: string[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const { meta, next } = parseFrontMatter(lines);
  const speakers = Object.keys((meta.speakers ?? {}) as Record<string, string>);
  const edits: Edit[] = [];
  const scenes: Scene[] = [];

  let scene: Scene & { line: number } = { id: "", heading: "開始前", showHeading: false, sentences: [], elements: [], line: next + 1 };
  let anchor: number | undefined;
  let lastAnchor = -Infinity;
  let speaker: string | undefined;

  const flush = () => {
    const { line: _, ...s } = scene;
    // 「開始前」に発言がなければシーンを作らない
    if (s.sentences.length || s.splitAt !== undefined) scenes.push({ ...s, id: `s${String(scenes.length + 1).padStart(2, "0")}` });
  };

  for (let i = next; i < lines.length; i++) {
    const raw = lines[i];
    // !cut・@時刻・## 区間 の行は、後ろの「 # コメント」を読み飛ばす（発言の中の # はそのまま）
    const line = /^\s*(!|@|##\s)/.test(raw) ? raw.replace(/\s+#\s.*$/, "").trim() : raw.trim();
    const no = i + 1;
    if (!line || /^<!--.*-->$/.test(line)) continue;
    try {
      let m: RegExpMatchArray | null;
      if ((m = line.match(new RegExp(String.raw`^!(cut|fast)\s+(${TIME})\s*-\s*(${TIME})(?:\s+x(\d+(?:\.\d+)?))?$`)))) {
        const e: Edit = { type: m[1] as Edit["type"], from: parseTime(m[2]), to: parseTime(m[3]), rate: m[1] === "fast" ? Number(m[4] ?? 2) : 1 };
        if (e.to <= e.from) throw new Error(`!${e.type} の終わりが始まりより前です`);
        if (e.type === "fast" && e.rate <= 1) throw new Error("!fast の倍率は 1 より大きくしてください（例: x4）");
        edits.push(e);
      } else if ((m = line.match(new RegExp(String.raw`^##\s+(.+?)\s+@(${TIME})$`)))) {
        flush();
        const at = parseTime(m[2]);
        const prev = [...scenes].reverse().find((s) => s.splitAt !== undefined)?.splitAt;
        if (prev !== undefined && at <= prev) throw new Error(`区間「${m[1]}」の時刻が前の区間より前です`);
        scene = { id: "", heading: m[1], showHeading: false, sentences: [], elements: [], splitAt: at, line: no };
      } else if (/^##\s/.test(line)) {
        throw new Error("区間の見出しには録画の時刻を付けてください（例: ## 1-1 @0:06）");
      } else if ((m = line.match(new RegExp(String.raw`^@(${TIME})$`)))) {
        anchor = parseTime(m[1]);
        if (anchor < lastAnchor) throw new Error(`@${m[1]} が前の @ より前の時刻です（実況は時刻順に書いてください）`);
        lastAnchor = anchor;
      } else if (line.startsWith("!") || line.startsWith(":::")) {
        throw new Error(`ゲーム実況の台本では使えない行です: ${line}（使えるのは !cut / !fast / @時刻 / ## 区間 @時刻 / 話者: 発言）`);
      } else {
        const said = line.match(/^([^:：\s]{1,20})\s*[:：]\s*(.+)$/);
        let text = line;
        if (said && speakers.includes(said[1])) {
          speaker = said[1];
          text = said[2];
        } else if (speakers.length && !speaker) {
          throw new Error(`発言の頭に話者を書いてください（例: ${speakers[0]}: …）。使える話者: ${speakers.join("、")}`);
        }
        if (anchor === undefined && !scene.sentences.length && !scenes.some((s) => s.sentences.length)) {
          throw new Error("最初の発言の前に、録画の時刻を @0:00 のように書いてください");
        }
        takeSentenceMarkers(splitSentences(text)).forEach((s, k) => {
          scene.sentences.push({ ...s, ...(speaker && { speaker }), ...(k === 0 && anchor !== undefined && { at: anchor }) });
        });
        anchor = undefined; // 同じ @ の続きの発言は、前の発言が終わってから
      }
    } catch (e) {
      problems.push(`${no}行目: ${(e as Error).message}`);
    }
  }
  flush();

  if (!scenes.some((s) => s.splitAt !== undefined)) problems.push("区間がありません（## 1-1 @0:06 のように書いてください）");
  if (!meta.video) problems.push("フロントマターに video:（録画ファイル）を書いてください");
  for (const k of ["runStart", "runEnd"]) {
    if (meta[k] === undefined) problems.push(`フロントマターに ${k}:（録画内で計測を${k === "runStart" ? "始めた" : "終えた"}時刻）を書いてください`);
    else {
      try {
        parseTime(meta[k] as string);
      } catch (e) {
        problems.push(`${k}: ${(e as Error).message}`);
      }
    }
  }
  for (const [name, voice] of Object.entries((meta.speakers ?? {}) as Record<string, string>)) {
    if (!voice) problems.push(`speakers: の「${name}」に声がありません`);
  }
  if (problems.length) throw new ScriptError(problems);
  return SceneDoc.parse({ version: 1, meta: { ...meta, layout: "biim" }, scenes, edits });
}
