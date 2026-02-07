// lib/probe.ts
import ffprobeStatic from "ffprobe-static";
import { spawn } from "node:child_process";

export async function getAudioDurationSeconds(path: string): Promise<number> {
  const ffprobePath = ffprobeStatic.path;
  if (!ffprobePath) throw new Error("ffprobe path not found");

  const args = [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path
  ];

  const out = await new Promise<string>((resolve, reject) => {
    const p = spawn(ffprobePath, args);
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += String(d)));
    p.stderr.on("data", (d) => (stderr += String(d)));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `ffprobe failed (${code})`));
    });
  });

  const dur = Number(out);
  if (!Number.isFinite(dur) || dur <= 0) throw new Error("Could not read MP3 duration");
  return dur;
}
