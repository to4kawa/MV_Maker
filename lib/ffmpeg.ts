import { exec as cpExec } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";

export const exec = promisify(cpExec);

function resolveBundledPath(): string | null {
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const bundledPath = join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
  return existsSync(bundledPath) ? bundledPath : null;
}

export function getFfmpegPath(): string {
  const envPath = process.env.FFMPEG_PATH;
  if (envPath && existsSync(envPath)) return envPath;

  if (ffmpegPath && existsSync(ffmpegPath)) return ffmpegPath;

  const bundledPath = resolveBundledPath();
  if (bundledPath) return bundledPath;

  return "ffmpeg";
}
