import { describe, expect, it } from "vitest";
import { parseScript, ScriptError, splitSentences } from "../src/parse";

const sample = `---
title: テスト
voice: metan
speed: 1.2
---

# 無視される見出し

## なぜキー設計が大事か

DynamoDBでは、データの置き場所がキーで決まります。キーが偏ると、集中します。
三つ目の文！

:::bullets
- {1} 置き場所はキーで決まる
- {2} 偏ると集中 {!3}
- 番号なし
:::

## 悪い例

日付をキーにしています。
集中します。

:::code lang=ts highlight="{1}:1 {2}:2-3,5"
  const a = 1;
  const b = 2;
:::

:::callout {2}
要点
:::
`;

describe("parseScript", () => {
  const doc = parseScript(sample);

  it("フロントマターを読む", () => {
    expect(doc.meta).toMatchObject({ title: "テスト", voice: "metan", speed: 1.2, theme: "wakaba", fps: 30 });
  });

  it("## ごとにシーンを作り、文に分ける", () => {
    expect(doc.scenes.map((s) => s.id)).toEqual(["s01", "s02"]);
    expect(doc.scenes[0].sentences.map((s) => s.text)).toEqual([
      "DynamoDBでは、データの置き場所がキーで決まります。",
      "キーが偏ると、集中します。",
      "三つ目の文！",
    ]);
  });

  it("箇条書きの {n} と強調 {!n} を読む", () => {
    expect(doc.scenes[0].elements[0]).toEqual({
      type: "bullets",
      items: [
        { text: "置き場所はキーで決まる", at: 1 },
        { text: "偏ると集中", at: 2, emphasisAt: 3 },
        { text: "番号なし" },
      ],
    });
  });

  it("コードのハイライト指定とインデント除去", () => {
    expect(doc.scenes[1].elements[0]).toMatchObject({
      type: "code",
      lang: "ts",
      code: "const a = 1;\nconst b = 2;",
      highlights: [
        { at: 1, lines: [1] },
        { at: 2, lines: [2, 3, 5] },
      ],
    });
    expect(doc.scenes[1].elements[1]).toEqual({ type: "text", text: "要点", variant: "callout", at: 2 });
  });

  it("title だけのシーンは見出しバーを出さない", () => {
    const d = parseScript("## 表紙\n\nこんにちは。\n\n:::title\n大タイトル\nサブ\n:::\n");
    expect(d.scenes[0].showHeading).toBe(false);
    expect(d.scenes[0].elements[0]).toEqual({ type: "title", title: "大タイトル", subtitle: "サブ" });
  });

  it("存在しない文番号・未知の部品・ナレーションなしを行番号付きで報告する", () => {
    const bad = "## A\n\n:::bullets\n- {2} x\n:::\n\n:::foo\n:::\n## B\n\n文。\n";
    try {
      parseScript(bad);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ScriptError);
      const p = (e as ScriptError).problems.join("\n");
      expect(p).toContain("7行目: 未知の部品 :::foo");
      expect(p).toContain("3行目: {2} を指定していますが");
      expect(p).toContain("1行目: シーン「A」にナレーションがありません");
    }
  });
});

describe("splitSentences", () => {
  it("句点・感嘆符・改行で分け、句読点は前の文に付ける", () => {
    expect(splitSentences("あ。い！？\nう\n\nえ?")).toEqual(["あ。", "い！？", "う", "え?"]);
  });
});

describe("表情の指定", () => {
  it("文頭の {face:x} を取り出し、{face:x} だけの行は次の文に付ける", () => {
    const d = parseScript("## A\n\n{face:smile}こんにちは。普通の文。\n{face:think}\nどうしよう。\n");
    expect(d.scenes[0].sentences).toEqual([{ text: "こんにちは。", face: "smile" }, { text: "普通の文。" }, { text: "どうしよう。", face: "think" }]);
  });
});
