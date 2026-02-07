import { exec as cpExec } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";

export const exec = promisify(cpExec);

export function getFfmpegPath(): string {
  if (!ffmpegPath) throw new Error("ffmpeg-static did not provide a binary path");
  return ffmpegPath;
}
