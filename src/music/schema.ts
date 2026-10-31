// 曲の台本（layout: song）の型。セクション（## イントロ / ## Aメロ / ## サビ …）が Scene、フレーズ（melody: と lyrics: の組）が文になる。
import { z } from "zod";

/** 伴奏の型 */
export const ARRANGEMENTS = ["pop", "rock", "ballad", "chiptune", "edm"] as const;
export const Arrangement = z.enum(ARRANGEMENTS);
export type Arrangement = z.infer<typeof Arrangement>;

/** セクションの盛り上がり。low: ドラムなし・伸ばし中心 / mid: ドラムあり / high: 全部の楽器・頭でシンバル */
export const Energy = z.enum(["low", "mid", "high"]);
export type Energy = z.infer<typeof Energy>;

/** 1つの音符。key は MIDI の番号（休符は null）、steps は升目の数、lyric は歌詞の1音（休符・楽器だけなら空） */
export const Note = z.object({ key: z.number().int().nullable(), steps: z.number().int().min(1), lyric: z.string() });
export type Note = z.infer<typeof Note>;

export const SongSection = z.object({
  /** 1小節の升目の数（8: 8分音符 / 16: 16分音符） */
  grid: z.number().int().min(4).max(32),
  bars: z.number().int().min(1),
  /** 小節ごとのコード（1小節に2つなら "C,G"） */
  chords: z.array(z.string()),
  energy: Energy,
  /** フレーズ：セクションの頭からの升目の位置と音符 */
  /** show: そのフレーズの間、画面に大きく出す文字（覚えたい用語など） */
  phrases: z.array(z.object({ at: z.number().int().min(0), notes: z.array(Note), show: z.string().optional() })),
});
export type SongSection = z.infer<typeof SongSection>;
