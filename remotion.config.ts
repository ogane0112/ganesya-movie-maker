// gmm preview（Remotion Studio）用の設定。場面のコード（:::custom）の登録表と道具を差し込む。
// gmm preview が GMM_CUSTOM_SCENES / GMM_MOTION_KIT に、書き出し先の登録表と道具のパスを入れて起動する。
import { Config } from "@remotion/cli/config";
import path from "node:path";

Config.overrideWebpackConfig((c) => ({
  ...c,
  resolve: {
    ...c.resolve,
    alias: {
      ...(c.resolve?.alias as Record<string, string>),
      "gmm-custom-scenes": process.env.GMM_CUSTOM_SCENES ?? path.resolve("remotion/motion/no-custom-scenes.ts"),
      "gmm-motion": process.env.GMM_MOTION_KIT ?? path.resolve("remotion/motion/kit.ts"),
    },
  },
}));
