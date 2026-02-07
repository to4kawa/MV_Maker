import ffmpegPath from "ffmpeg-static";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import { access, chmod } from "node:fs/promises";

export const exec = promisify(_exec);

export function getFfmpegPath() {
  if (!ffmpegPath) throw new Error("ffmpeg-static: ffmpeg path not found");
  return ffmpegPath;
}

export async function ensureFfmpegExecutable(path: string) {
  // 存在チェック
  await access(path);
  // 実行ビット（環境によって落ちてるので付け直す）
  await chmod(path, 0o755);
}
