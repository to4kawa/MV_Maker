// lib/ffmpeg.ts
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";

type RenderOpts = {
  imagePath: string;
  audioPath: string;
  outPath: string;
  fps: number;
  size: number; // 1024
};

export async function renderMp4WithSpectrum(opts: RenderOpts): Promise<void> {
  if (!ffmpegPath) throw new Error("ffmpeg path not found");

  const { imagePath, audioPath, outPath, fps, size } = opts;

  const specH = Math.round(size * 0.18); // 18% height
  const specY = size - specH;
  const bands = 64;

  // Spectrum layer:
  // - mono mix
  // - bars along bottom
  // - smoothed by showfreqs "win_size" and post blur for subtle glow
  // Note: showfreqs has limited "peak hold"; we approximate with a little temporal smoothing via tmix.
  const filter = [
    // background image
    `[0:v]scale=${size}:${size}:flags=lanczos,format=rgba[bg]`,

    // audio -> spectrum (bars), then create faint glow + core
    `[1:a]aformat=channel_layouts=mono,showfreqs=s=${size}x${specH}:mode=bar:fscale=log:ascale=log:win_size=2048:colors=White@0.70,format=rgba[spec]`,

    // mild temporal smoothing and glow
    `[spec]tmix=frames=3:weights='1 2 1',split[core][glow]`,
    `[glow]gblur=sigma=8,format=rgba[glowb]`,
    `[bg][glowb]overlay=0:${specY}[b1]`,
    `[b1][core]overlay=0:${specY}[v]`
  ].join(";");

  const args = [
    "-y",

    // image as looping video
    "-loop", "1",
    "-i", imagePath,

    // audio
    "-i", audioPath,

    "-filter_complex", filter,

    "-map", "[v]",
    "-map", "1:a",

    "-r", String(fps),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "veryfast",
    "-crf", "18",

    "-c:a", "aac",
    "-b:a", "192k",

    // exact match audio length
    "-shortest",

    "-movflags", "+faststart",
    outPath
  ];

  await new Promise<void>((resolve, reject) => {
    const p = spawn(ffmpegPath as string, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += String(d)));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg failed (${code})`));
    });
  });
}
