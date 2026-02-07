import { exec, FFPROBE_BIN } from "@/lib/ffmpeg";

export async function probe(path: string): Promise<number> {
  const { stdout } = await exec(
    `${FFPROBE_BIN} -v error -show_entries format=duration -of csv=p=0 "${path}"`
  );
  return parseFloat(stdout.trim());
}
