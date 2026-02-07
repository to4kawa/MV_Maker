import { exec } from "@/lib/ffmpeg";
import ffprobe from "ffprobe-static";

export async function probe(path: string): Promise<number> {
  const bin = ffprobe?.path;
  if (!bin) throw new Error("ffprobe-static did not provide a binary path");

  const { stdout } = await exec(
    `"${bin}" -v error -show_entries format=duration -of default=nw=1:nk=1 "${path}"`
  );

  const dur = Number.parseFloat((stdout ?? "").trim());
  if (!Number.isFinite(dur) || dur <= 0) throw new Error(`Invalid duration from ffprobe: "${stdout}"`);
  return dur;
}
