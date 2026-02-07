import { exec, getFfmpegPath } from "@/lib/ffmpeg";

export async function probe(path: string): Promise<number> {
  const ffmpeg = getFfmpegPath();
  const cmd = `"${ffmpeg}" -hide_banner -i "${path}"`;

  // ffmpeg -i は正常でも exit code 1 を返しがちなので、
  // 成否ではなく “出力テキスト” を必ず回収して Duration を抜く。
  let text = "";
  try {
    const { stdout, stderr } = await exec(cmd);
    text = `${stdout ?? ""}\n${stderr ?? ""}`;
  } catch (e: any) {
    text = `${e?.stdout ?? ""}\n${e?.stderr ?? ""}\n${e?.message ?? ""}`;
  }

  // 例: Duration: 00:08:00.12,
  const m = text.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i);
  if (!m) {
    const head = text.replace(/\s+/g, " ").slice(0, 300);
    throw new Error(`Could not parse duration from ffmpeg output. head="${head}"`);
  }

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  const dur = hh * 3600 + mm * 60 + ss;

  if (!Number.isFinite(dur) || dur <= 0) {
    throw new Error(`Invalid duration parsed: ${dur}`);
  }
  return dur;
}
