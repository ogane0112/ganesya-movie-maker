// 曲の台本（layout: song）のパーサ。
//
//   ---                                    フロントマター（layout: song / bpm / music: pop / singer: zundamon / character …）
//   ## サビ chords="F G Em Am | F G C C" energy=high bg=sunburst   セクション。コードは1小節に1つ（"C,G" で半分ずつ）
//   melody: E5 - D5 C5 D5 - E5 - | G5 - - - . . . . |   メロディ。1つが1升目（既定は8分音符）。- で伸ばす、. は休み、| は小節の区切り
//   lyrics: ずんだもちが                    歌詞（ひらがな）。音符1つに1音（きゃ・っ・ん も1音、ー は前の母音）
//   text: ずんだ餅が                        画面に出す歌詞（省略すると lyrics をそのまま）
//   show: DNS\n名前解決                     そのフレーズの間、画面に大きく出す文字（覚えたい用語など。\n で改行）
//   face: surprised                         そのフレーズから歌う人の表情を変える
//   :::diagram … :::                        解説動画の部品（図解・箇条書き・用語カード…）。{n} は n 番目のフレーズで出す。
//                                           部品があると、画面はスライド（左）と歌う人（右）になる
//
// 書き方は docs/song.md。
import { buildElement, parseArgs, parseFrontMatter, referencedSentences, ScriptError } from "../parse.js";
import { Element, SceneDoc, type Scene } from "../schema.js";
import { Energy, type Note } from "./schema.js";
import { isKana, noteToMidi, parseChord, splitMora } from "./score.js";

/** 歌える声の名前 → VOICEVOX の歌手名 */
export const SINGERS: Record<string, string> = {
  zundamon: "ずんだもん",
  metan: "四国めたん",
  tsumugi: "春日部つむぎ",
  hau: "雨晴はう",
  ritsu: "波音リツ",
  takehiro: "玄野武宏",
  kotaro: "白上虎太郎",
  ryusei: "青山龍星",
  himari: "冥鳴ひまり",
  sora: "九州そら",
};

/** 歌う人の表示名（字幕・口パクの話者名） */
export function singerName(spec: string): string {
  const [name] = spec.split(":");
  return SINGERS[name] ?? (/^\d+$/.test(name) ? "うた" : name);
}

/** セクション名から盛り上がりの既定を決める */
export function defaultEnergy(heading: string): Energy {
  if (/サビ|chorus|hook|ラスサビ/i.test(heading)) return "high";
  if (/アウトロ|outro|エンディング|ending|落ち/i.test(heading)) return "low";
  return "mid";
}

/** melody: の1行を音符にする。bars: 小節ごとの升目の数（| で区切ったときの検査用） */
export function parseMelody(src: string, grid: number): { notes: Note[]; steps: number } {
  const bars = src.split("|").map((b) => b.trim());
  if (bars.at(-1) === "") bars.pop();
  const notes: Note[] = [];
  let steps = 0;
  const useBars = src.includes("|");
  bars.forEach((bar, bi) => {
    const tokens = bar.split(/\s+/).filter(Boolean);
    if (useBars && tokens.length !== grid) {
      throw new Error(`melody: の ${bi + 1} 小節目が ${tokens.length} 升です（1小節は ${grid} 升。足りない所は . で休むか - で伸ばす）: ${bar}`);
    }
    for (const t of tokens) {
      steps++;
      const last = notes[notes.length - 1];
      if (t === "-") {
        if (!last) throw new Error("melody: が - で始まっています（伸ばす音がありません）");
        last.steps++;
      } else if (t === "." || t === "r") {
        if (last && last.key === null) last.steps++;
        else notes.push({ key: null, steps: 1, lyric: "" });
      } else {
        const key = noteToMidi(t);
        if (key === undefined) throw new Error(`melody: の「${t}」がわかりません（音名は C4 / F#4 / Bb3、伸ばすのは -、休みは .）`);
        notes.push({ key, steps: 1, lyric: "" });
      }
    }
  });
  return { notes, steps };
}

export function parseSongScript(source: string): SceneDoc {
  const problems: string[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const { meta, next } = parseFrontMatter(lines);
  const singer = String(meta.singer ?? "zundamon");
  const sung = singer !== "none";
  const name = sung ? singerName(singer) : "うた";
  // 画面は歌詞のカラオケ（太い字幕）。立ち絵は歌う人として真ん中に立つ
  meta.se ??= "none";
  meta.theme ??= "pop";
  const format = String(meta.format ?? "wide");
  if (format === "short") (meta.width = 1080), (meta.height = 1920);
  else if (format === "square") (meta.width = 1080), (meta.height = 1080);
  meta.speakers = { [name]: "zundamon" };
  meta.characters = meta.character && meta.character !== "none" ? { [name]: String(meta.character) } : {};
  delete meta.character;
  const transpose = Number(meta.transpose ?? 0);
  const fit = meta.fit === "auto";
  delete meta.fit;

  type Phrase = { melody: string; line: number; lyrics?: string; text?: string; show?: string; face?: string };
  type Cur = { heading: string; line: number; params: Record<string, string>; phrases: Phrase[]; elements: { el: unknown; line: number }[] };
  const sections: Cur[] = [];
  let cur: Cur | null = null;
  for (let i = next; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      let heading = h[1].trim();
      const params: Record<string, string> = {};
      for (;;) {
        const m = heading.match(/\s+(\w+)=("[^"]*"|\S+)$/);
        if (!m) break;
        params[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
        heading = heading.slice(0, m.index).trim();
      }
      sections.push((cur = { heading, line: i + 1, params, phrases: [], elements: [] }));
      continue;
    }
    if (!line.trim() || /^\s*<!--.*-->\s*$/.test(line)) continue;
    // 解説動画の部品（::: で閉じる）
    const block = line.match(/^:::(\w+)\s*(.*)$/);
    if (block) {
      const start = i + 1;
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") body.push(lines[i++]);
      if (i >= lines.length) problems.push(`${start}行目: :::${block[1]} が閉じられていません`);
      if (!cur) problems.push(`${start}行目: ## セクションより前に部品があります`);
      else {
        try {
          cur.elements.push({ el: buildElement(block[1], parseArgs(block[2]), body), line: start });
        } catch (e) {
          problems.push(`${start}行目: ${(e as Error).message}`);
        }
      }
      continue;
    }
    const kv = line.match(/^\s*(melody|lyrics|text|show|face)\s*[:：]\s*(.*)$/);
    if (!cur) {
      if (kv) problems.push(`${i + 1}行目: ## セクションより前に ${kv[1]}: があります`);
      continue;
    }
    if (!kv) {
      problems.push(`${i + 1}行目: 曲の台本の行は melody: / lyrics: / text: / show: / face: か、::: の部品です: ${line.trim().slice(0, 30)}`);
      continue;
    }
    const [, key, value] = kv;
    if (key === "melody") cur.phrases.push({ melody: value, line: i + 1 });
    else if (!cur.phrases.length) problems.push(`${i + 1}行目: ${key}: の前に melody: を書いてください`);
    else cur.phrases[cur.phrases.length - 1][key as "lyrics" | "text" | "show" | "face"] = value.trim();
  }

  const scenes: Scene[] = [];
  for (const sec of sections) {
    const p = sec.params;
    const grid = Number(p.grid ?? 8);
    const chords = (p.chords ?? "").split(/[\s|]+/).filter(Boolean);
    for (const c of chords) {
      for (const one of c.split(",")) {
        try {
          parseChord(one);
        } catch (e) {
          problems.push(`${sec.line}行目: ${(e as Error).message}`);
        }
      }
    }
    const energy = Energy.safeParse(p.energy ?? defaultEnergy(sec.heading));
    if (!energy.success) problems.push(`${sec.line}行目: energy= は low / mid / high のどれかです`);
    for (const k of Object.keys(p)) {
      if (!["chords", "bars", "grid", "energy", "bg", "transition"].includes(k)) problems.push(`${sec.line}行目: 見出しの ${k}= は使えません（chords= bars= grid= energy= bg= transition=）`);
    }
    if (![4, 8, 12, 16].includes(grid)) problems.push(`${sec.line}行目: grid= は 4 / 8 / 12 / 16 のどれかです`);

    let at = 0;
    const phrases: { at: number; notes: Note[] }[] = [];
    const sentences: Scene["sentences"] = [];
    for (const ph of sec.phrases) {
      try {
        const parsed = parseMelody(ph.melody, grid);
        const { steps } = parsed;
        let notes = parsed.notes;
        let pitched = notes.filter((n) => n.key !== null);
        if (sung) {
          if (!ph.lyrics) throw new Error("melody: の次に lyrics: で歌詞（ひらがな）を書いてください");
          const mora = splitMora(ph.lyrics);
          const bad = mora.filter((m) => !isKana(m));
          if (bad.length) throw new Error(`lyrics: はひらがな・カタカナで書いてください（漢字などは text: に）: ${bad.slice(0, 5).join(" ")}`);
          // fit: auto なら、歌詞の音の数に合わせて音符を分けたりまとめたりする（同じ旋律を違う歌詞で繰り返すとき）
          if (mora.length !== pitched.length && fit) {
            notes = fitNotes(notes, mora.length);
            pitched = notes.filter((n) => n.key !== null);
          }
          if (mora.length !== pitched.length) {
            throw new Error(`歌詞が ${mora.length} 音（${mora.join(" ")}）ですが、音符は ${pitched.length} 個です。音符1つに1音にしてください（伸ばすなら - 、ー は1音に数えます）`);
          }
          pitched.forEach((n, k) => (n.lyric = mora[k]));
        }
        for (const n of notes) if (n.key !== null) n.key += transpose;
        phrases.push({ at, notes, ...(ph.show && { show: ph.show }) });
        sentences.push({ text: ph.text ?? ph.lyrics ?? "♪", speaker: name, ...(ph.face && { face: ph.face }) });
        at += steps;
      } catch (e) {
        problems.push(`${ph.line}行目: ${(e as Error).message}`);
      }
    }
    const bars = Math.max(Number(p.bars ?? 0), Math.ceil(at / grid), chords.length, 1);
    const elements: Element[] = [];
    for (const { el, line } of sec.elements) {
      const r = Element.safeParse(el);
      if (!r.success) {
        problems.push(`${line}行目: 部品の指定が不正です: ${r.error.issues.map((x) => x.message).join(", ")}`);
        continue;
      }
      for (const n of referencedSentences(r.data)) {
        if (n > sentences.length) problems.push(`${line}行目: {${n}} を指定していますが、セクション「${sec.heading}」のフレーズは${sentences.length}つです（{n} は n 番目のフレーズ）`);
      }
      elements.push(r.data);
    }
    if (!chords.length) problems.push(`${sec.line}行目: セクション「${sec.heading}」に chords="C G Am F" のようにコードを書いてください`);
    scenes.push({
      id: `s${String(scenes.length + 1).padStart(2, "0")}`,
      heading: sec.heading,
      showHeading: false,
      sentences,
      elements,
      skit: { ...(p.bg && { bg: p.bg }), transition: (p.transition as "cut") ?? "cut", tail: [] },
      song: { grid, bars, chords: chords.length ? chords : ["C"], energy: energy.success ? energy.data : "mid", phrases },
    });
  }
  if (!scenes.length) problems.push("セクションがありません（## イントロ chords=\"C G Am F\" のように始めてください）");
  if (problems.length) throw new ScriptError(problems);
  return SceneDoc.parse({ version: 1, meta: { ...meta, layout: "song", style: meta.style ?? "meme", subtitleStyle: meta.subtitleStyle ?? "bold" }, scenes });
}

/**
 * 音符の数を n 個（休みを除く）にそろえる。旋律の形はできるだけ残す。
 * 多すぎる歌詞：いちばん長い音を同じ高さの 2 つに分ける（長い音がなければ、すぐ後の休みを音にする）。
 * 少なすぎる歌詞：いちばん短い、休みをはさまずに続く 2 音を 1 つにまとめる。
 * できなければそのまま返す（呼び出し側が数の違いをエラーにする）
 */
export function fitNotes(input: Note[], n: number): Note[] {
  const notes = input.map((x) => ({ ...x }));
  const count = () => notes.filter((x) => x.key !== null).length;
  let guard = 64;
  while (count() < n && guard--) {
    let best = -1;
    notes.forEach((x, i) => x.key !== null && x.steps >= 2 && (best < 0 || x.steps > notes[best].steps) && (best = i));
    if (best >= 0) {
      const x = notes[best];
      const a = Math.ceil(x.steps / 2);
      notes.splice(best, 1, { ...x, steps: a }, { ...x, steps: x.steps - a });
      continue;
    }
    // 長い音がない：前に音のある休みを 1 升だけ音にする
    const r = notes.findIndex((x, i) => x.key === null && i > 0 && notes[i - 1].key !== null);
    if (r < 0) break;
    const prev = notes[r - 1];
    notes.splice(r, 0, { key: prev.key, steps: 1, lyric: "" });
    notes[r + 1].steps--;
    if (notes[r + 1].steps === 0) notes.splice(r + 1, 1);
  }
  while (count() > n && guard--) {
    let best = -1;
    for (let i = 0; i + 1 < notes.length; i++) {
      if (notes[i].key === null || notes[i + 1].key === null) continue;
      if (best < 0 || notes[i].steps + notes[i + 1].steps < notes[best].steps + notes[best + 1].steps) best = i;
    }
    if (best < 0) break;
    notes[best].steps += notes[best + 1].steps;
    notes.splice(best + 1, 1);
  }
  return notes;
}
