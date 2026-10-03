// 専門用語の候補を台本から拾う（gmm terms）。カタカナ語と英字の語を数えるだけの手がかりで、
// 用語かどうかの判断はしない。glossary: に入れるかは書き手（AI・人）が決める。
import type { SceneDoc } from "./schema.js";

export type TermCandidate = { word: string; count: number; firstScene: string; inGlossary: boolean; explained: boolean };

/** 説明が要らない、よくあるカタカナ語 */
const COMMON = new Set(["データ", "サーバー", "ユーザー", "コード", "アクセス", "ポイント", "イメージ", "パターン", "タイプ", "ケース", "サービス", "ファイル", "システム", "テスト", "エラー", "シーン", "リクエスト", "スピード", "ページ"]);

export function findTermCandidates(doc: SceneDoc): TermCandidate[] {
  const found = new Map<string, TermCandidate>();
  const glossary = doc.meta.glossary;
  const explained = new Set(doc.scenes.flatMap((s) => [...s.sentences.flatMap((x) => x.explains ?? []), ...s.elements.flatMap((e) => (e.type === "term" ? [e.term] : []))]));
  for (const scene of doc.scenes) {
    const texts = [
      scene.heading,
      ...scene.sentences.map((s) => s.text),
      ...scene.elements.flatMap((el) => {
        switch (el.type) {
          case "title":
            return [el.title, el.subtitle ?? ""];
          case "bullets":
            return el.items.map((i) => i.text);
          case "text":
            return [el.text];
          case "diagram":
            return [...el.nodes.map((n) => n.text), ...el.edges.map((e) => e?.label ?? "")];
          default:
            return [];
        }
      }),
    ];
    for (const text of texts) {
      for (const m of text.matchAll(/[ァ-ヴー]{3,}|[A-Za-z][A-Za-z0-9]+/g)) {
        const word = m[0];
        if (COMMON.has(word) || /^ー/.test(word)) continue;
        const c = found.get(word) ?? { word, count: 0, firstScene: scene.id, inGlossary: !!glossary[word], explained: explained.has(word) };
        c.count++;
        found.set(word, c);
      }
    }
  }
  return [...found.values()].sort((a, b) => b.count - a.count || a.firstScene.localeCompare(b.firstScene));
}
