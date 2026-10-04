import { describe, expect, it } from "vitest";
import { marpToScript, parseSlide } from "../src/marp";
import { parseScript } from "../src/parse";

const deck = `---
marp: true
paginate: true
---

<!-- _class: lead -->
# 入門

副題

---

## 箇条書き

- 一つ目
  - 補足
- **二つ目**

<!--
一文目です。二文目です。
-->

---

## コード

\`\`\`ts
const a = 1;
---
\`\`\`

---

## 表

| 方法 | 長所 |
| --- | --- |
| A | 速い |

![bg](back.png)
![図の説明](img/a.png)
`;

describe("marpToScript", () => {
  const r = marpToScript(deck, { imagePath: (s) => `slides/${s}` });

  it("スライド1枚が1シーンになり、そのまま台本として読める", () => {
    expect(r.scenes).toBe(4);
    const doc = parseScript(r.script);
    expect(doc.scenes.map((s) => s.heading)).toEqual(["入門", "箇条書き", "コード", "表"]);
  });

  it("表紙は :::title、発表者ノートはナレーション", () => {
    const doc = parseScript(r.script);
    expect(doc.scenes[0].elements[0]).toMatchObject({ type: "title", title: "入門", subtitle: "副題" });
    expect(doc.scenes[1].sentences.map((s) => s.text)).toEqual(["一文目です。", "二文目です。"]);
    // 入れ子の項目は親にまとめ、太字などの記法は外す。文の数を越える番号は最後の文に寄せる
    expect(doc.scenes[1].elements[0]).toMatchObject({
      type: "bullets",
      items: [
        { text: "一つ目（補足）", at: 1 },
        { text: "二つ目", at: 2 },
      ],
    });
  });

  it("コードブロックの中の --- ではスライドを分けない", () => {
    const doc = parseScript(r.script);
    expect(doc.scenes[2].elements[0]).toMatchObject({ type: "code", lang: "ts", code: "const a = 1;\n---" });
  });

  it("ノートがなければ仮のナレーション。表は箇条書きに、背景画像は要確認に、画像のパスは書き換える", () => {
    expect(r.drafted).toBe(3); // 表紙・コード・表
    const doc = parseScript(r.script);
    const els = doc.scenes[3].elements;
    expect(els[0]).toMatchObject({ type: "bullets", items: [{ text: "A：速い" }] });
    expect(els[1]).toMatchObject({ type: "image", src: "slides/img/a.png", caption: "図の説明" });
    expect(r.todos.some((t) => t.includes("背景画像"))).toBe(true);
  });

  it("Marp の指示は発表者ノートにしない", () => {
    const s = parseSlide(["<!-- paginate: false -->", "<!-- _class: lead -->", "# A", "<!-- 話す内容 -->"]);
    expect(s.notes).toEqual(["話す内容"]);
    expect(s.lead).toBe(true);
  });
});
