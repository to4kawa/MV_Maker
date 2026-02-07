import { exec } from "@/lib/ffmpeg";
import ffprobePath from "ffprobe-static";

export async function probe(path: string): Promise<number> {
  const bin = ffprobePath?.path;
  if (!bin) throw new Error("ffprobe path not found");

  const { stdout } = await exec(
    `"${bin}" -v error -show_entries format=duration -of csv=p=0 "${path}"`
  );
  return parseFloat(stdout.trim());
}
