import fs from "fs";
import { createJiti } from "jiti";
import { join } from "pathe";
import { UserConfig } from "vite";

export const getViteConfig = async (workdir: string) => {
  const jiti = createJiti(workdir, { cache: false });
  let viteConfigName = "";
  try {
    if (fs.existsSync(join(workdir, "vite.config.ts"))) {
      viteConfigName = "vite.config.ts";
    }

    if (fs.existsSync(join(workdir, "vite.config.js"))) {
      viteConfigName = "vite.config.js";
    }
    if (!viteConfigName) {
      return null;
    }
    const viteConfig = await jiti.import<UserConfig>("./" + viteConfigName, {
      default: true,
    });
    return viteConfig;
  } catch (error) {
    return null;
  }
};

export const getNextConfig = async (workdir: string) => {
  const jiti = createJiti(workdir, { cache: false });
  let nextConfigName = "";
  try {
    if (fs.existsSync(join(workdir, "next.config.js"))) {
      nextConfigName = "next.config.js";
    }

    if (!nextConfigName) {
      return null;
    }
    const nextConfig = await jiti.import<any>("./next.config.js", {
      default: true,
    });
    return nextConfig;
  } catch (error) {
    return null;
  }
}