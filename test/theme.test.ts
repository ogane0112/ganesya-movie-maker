import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "../remotion/theme";
import { loadTheme } from "../src/theme";

describe("loadTheme", () => {
  it("組み込みテーマを名前で返す", async () => {
    expect(await loadTheme("dark", "a.md", "out")).toBe(THEMES.dark);
  });

  it("JSON は extends したテーマを上書きする（字幕は項目ごとにマージ）", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gmm-theme-"));
    await writeFile(join(dir, "base.json"), JSON.stringify({ extends: "dark", accent: "#ff0000" }));
    await writeFile(join(dir, "my.json"), JSON.stringify({ extends: "base.json", fontSize: 52, subtitle: { color: "#ffff00" } }));
    const t = await loadTheme("my.json", join(dir, "script.md"), join(dir, "out"));
    expect(t).toMatchObject({ name: "my", background: THEMES.dark.background, accent: "#ff0000", fontSize: 52 });
    expect(t.subtitle).toEqual({ ...THEMES.dark.subtitle, color: "#ffff00" });
  });

  it("不正な値・存在しないテーマを報告する", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gmm-theme-"));
    await writeFile(join(dir, "bad.json"), JSON.stringify({ fontSize: "大きく" }));
    await expect(loadTheme("bad.json", join(dir, "s.md"), dir)).rejects.toThrow("fontSize");
    await expect(loadTheme("nothing", join(dir, "s.md"), dir)).rejects.toThrow("テーマ「nothing」がありません");
  });
});
