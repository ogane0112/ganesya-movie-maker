// ゲーム実況のタイマー・区間の計算（Node 側の検査からも使う）
import type { RunInfo } from "../../src/schema";

/** 動画全体のフレーム → 録画の時刻（秒） */
export function videoTimeAt(frame: number, run: RunInfo, fps: number): number {
  for (const s of run.footage) {
    if (frame < s.from + s.durationInFrames) return s.videoFrom + (Math.max(0, frame - s.from) / fps) * s.rate;
  }
  const last = run.footage[run.footage.length - 1];
  return last ? last.videoFrom + (last.durationInFrames / fps) * last.rate : 0;
}

/** 計測タイム（秒）。計測前は 0、計測後は最終タイムで止まる */
export function runTimeAt(frame: number, run: RunInfo, fps: number): number {
  return Math.min(Math.max(videoTimeAt(frame, run, fps) - run.runStart, 0), run.runEnd - run.runStart);
}

/** いま走っている区間の番号（全区間を終えたら splits.length） */
export function currentSplit(runTime: number, run: RunInfo): number {
  const i = run.splits.findIndex((s) => runTime < s.endRunTime);
  return i === -1 ? run.splits.length : i;
}

/** 1:23.45 / 1:02:03.45 */
export function formatRunTime(sec: number): string {
  const cs = Math.floor(sec * 100 + 1e-6);
  const h = Math.floor(cs / 360000);
  const m = Math.floor(cs / 6000) % 60;
  const s = Math.floor(cs / 100) % 60;
  const c = cs % 100;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}.${pad(c)}` : `${m}:${pad(s)}.${pad(c)}`;
}
