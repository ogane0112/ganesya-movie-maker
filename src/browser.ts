// レンダリング・検査で使う Chromium を探す。
// GMM_BROWSER > Playwright 同梱の headless shell の順。見つからなければ undefined
// （Remotion は自分でダウンロードし、検査は playwright-core の既定を使う）。
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function findBrowser(): string | undefined {
  if (process.env.GMM_BROWSER) return process.env.GMM_BROWSER;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  for (const dir of readdirSync(base).sort().reverse()) {
    for (const bin of ["chrome-linux/headless_shell", "chrome-headless-shell-linux64/chrome-headless-shell", "chrome-linux/chrome"]) {
      const p = join(base, dir, bin);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}
