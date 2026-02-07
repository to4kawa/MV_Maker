import { exec, getFfmpegPath } from "@/lib/ffmpeg";

// ffmpeg -i の stderr から Duration を抜く（依存：ffmpegのみ）
export async function probe(path: string): Promise<number> {
  const ffmpeg = getFfmpegPath();

  // ffmpeg は情報を stderr に出す
  const cmd = `"${ffmpeg}" -i "${path}" -hide_banner`;
  try {
    await exec(cmd);
  } catch (e: any) {
    const out = String(e?.stderr ?? e?.stdout ?? "");
    const m = out.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (!m) throw new Error("Could not parse duration from ffmpeg output");

    const hh = Number(m[1]);
    const mm = Number(m[2]);
    const ss = Number(m[3]);
    return hh * 3600 + mm * 60 + ss;
  }

  throw new Error("ffmpeg did not return duration");
}
