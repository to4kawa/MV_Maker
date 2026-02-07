import { exec as cpExec } from "child_process";
import { promisify } from "util";

export const exec = promisify(cpExec);

// On Vercel (and most Linux envs), ffmpeg/ffprobe are available on PATH.
export const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";
export const FFPROBE_BIN = process.env.FFPROBE_BIN || "ffprobe";

export type RenderOpts = {
  imagePath: string;
  audioPath: string;
  outPath: string;
  durationSec: number;
  fps?: number;   // default 24
  size?: number;  // default 1024
  filters: string; // filter_complex string
};

export async function renderMp4WithSpectrum(opts: RenderOpts): Promise<void> {
  const { imagePath, audioPath, outPath, durationSec, filters } = opts;
  const fps = opts.fps ?? 24;

  const cmd = [
    FFMPEG_BIN,
    `-loop 1 -i "${imagePath}"`,
    `-i "${audioPath}"`,
    `-filter_complex "${filters}"`,
    `-t ${durationSec.toFixed(3)}`,
    `-r ${fps}`,
    `-c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 23`,
    `-c:a aac -shortest -y`,
    `"${outPath}"`
  ].join(" ");

  await exec(cmd);
}
