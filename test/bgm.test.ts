import { describe, expect, it } from "vitest";
import { findMp3Link, findTrack, loadCatalogs } from "../src/bgm";

describe("BGM カタログ", () => {
  it("カタログの曲は名前が重複せず、曲ページと説明がある", async () => {
    const tracks = await loadCatalogs();
    expect(tracks.length).toBeGreaterThan(5);
    const names = tracks.map((t) => `${t.catalog}:${t.id}`);
    expect(new Set(names).size).toBe(names.length);
    for (const t of tracks.filter((x) => x.catalog === "maou")) {
      expect(t.page).toBe(`https://maou.audio/bgm_${t.id}/`);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it("名前で曲を引き、ない名前は候補を添えてエラーにする。パスはカタログの名前ではない", async () => {
    expect((await findTrack("maou:acoustic50"))?.title).toBe("至福の隙間");
    await expect(findTrack("maou:nothing")).rejects.toThrow("カタログにありません");
    expect(await findTrack("assets/bgm.mp3")).toBeUndefined();
  });

  it("曲ページから MP3 のリンクを取り出す（相対パスも解決する）", () => {
    const page = "https://maou.audio/bgm_piano38/";
    expect(findMp3Link('<a href="/sound/bgm/x.mp3?v=1">MP3</a><a href="y.ogg">', page)).toBe("https://maou.audio/sound/bgm/x.mp3");
    expect(findMp3Link("<p>no audio</p>", page)).toBeUndefined();
  });
});
