import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import { access, chmod } from "node:fs/promises";

import { makeSpectrumFilters } from "@/lib/spectrum";
import { existsSync } from "node:fs";

const ffmpegPath = join(process.cwd(), "bin", "ffmpeg");

function getFfmpegPathStrict(): string {
  if (!existsSync(ffmpegPath)) throw new Error(`ffmpeg not found: ${ffmpegPath}`);
  return ffmpegPath;
}

export const runtime = "nodejs";

const exec = promisify(_exec);

function getFfmpegPathStrict(): string {
  if (!ffmpegPath) throw new Error("ffmpeg-static: ffmpeg path not found");
  if (ffmpegPath.includes("/.next/")) throw new Error(`BAD_FFMPEG_PATH=${ffmpegPath}`);
  return ffmpegPath;
}

async function ensureExecutable(p: string) {
  await access(p);
  await chmod(p, 0o755);
}


export async function POST(req: NextRequest) {
  const form = await req.formData();
  const audioFile = form.get("audio") as File | null;
  const imageFile = form.get("image") as File | null;

  if (!audioFile || !imageFile) return new NextResponse("Missing files", { status: 400 });
  if (audioFile.type !== "audio/mpeg") return new NextResponse("Only MP3 accepted", { status: 400 });

  if (!["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
    return new NextResponse("Image must be png/jpg/webp", { status: 400 });
  }

  const id = randomUUID();
  const tmp = tmpdir();

  const audioPath = join(tmp, `${id}.mp3`);
  const imgExt = imageFile.type === "image/jpeg" ? "jpg" : imageFile.type.split("/")[1];
  const imagePath = join(tmp, `${id}.${imgExt}`);
  const outPath = join(tmp, `${id}.mp4`);

  try {
    await writeFile(audioPath, Buffer.from(await audioFile.arrayBuffer()));
    await writeFile(imagePath, Buffer.from(await imageFile.arrayBuffer()));

    const filters = makeSpectrumFilters();
    const ffmpeg = getFfmpegPathStrict();
    await ensureExecutable(ffmpeg);

    const cmd = [
      `"${ffmpeg}"`,
      `-y`,
      `-loop 1 -i "${imagePath}"`,
      `-i "${audioPath}"`,
      `-filter_complex "${filters}"`,
      `-map "[v]" -map 1:a`,
      `-r 24`,
      `-c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 23`,
      `-c:a aac -shortest`,
      `"${outPath}"`
    ].join(" ");

    await exec(cmd);

    const mp4 = await readFile(outPath);
    return new NextResponse(mp4, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="output.mp4"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Render failed", { status: 500 });
  } finally {
    await Promise.all([audioPath, imagePath, outPath].map(async (p) => { try { await unlink(p); } catch {} }));
  }
}

export async function GET() {
  return new Response(
    JSON.stringify(
      { commit: process.env.VERCEL_GIT_COMMIT_SHA, env: process.env.VERCEL_ENV, cwd: process.cwd(), ffmpegPath },
      null,
      2
    ),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

