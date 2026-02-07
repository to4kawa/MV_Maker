import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, unlink, readFile, copyFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import { chmod } from "node:fs/promises";
import { existsSync } from "node:fs";

import { makeSpectrumFilters } from "@/lib/spectrum";

export const runtime = "nodejs";

const exec = promisify(_exec);

const ffmpegPath = join(process.cwd(), "bin", "ffmpeg");

function getFfmpegPathStrict(): string {
  if (!existsSync(ffmpegPath)) throw new Error(`ffmpeg not found: ${ffmpegPath}`);
  return ffmpegPath;
}

async function ensureExecutable(src: string) {
  const dst = join(tmpdir(), `ffmpeg-${randomUUID()}`);
  await copyFile(src, dst);
  await chmod(dst, 0o755);
  return dst;
}

export async function POST(req: NextRequest) {
  const { audioUrl, imageUrl } = (await req.json()) as { audioUrl?: string; imageUrl?: string };
  if (!audioUrl || !imageUrl) return new NextResponse("Missing URLs", { status: 400 });

  const id = randomUUID();
  const tmp = tmpdir();

  const audioPath = join(tmp, `${id}.mp3`);
  const imagePath = join(tmp, `${id}`);
  const outPath = join(tmp, `${id}.mp4`);

  let ffmpegTmpPath = "";
  let imagePathWithExt = "";

  try {
    const [audioRes, imageRes] = await Promise.all([fetch(audioUrl), fetch(imageUrl)]);

    if (!audioRes.ok) throw new Error(`audio fetch failed: ${audioRes.status}`);
    if (!imageRes.ok) throw new Error(`image fetch failed: ${imageRes.status}`);

    const audioType = audioRes.headers.get("content-type")?.split(";")[0] ?? "";
    if (audioType && audioType !== "audio/mpeg") {
      throw new Error(`Only MP3 accepted: ${audioType}`);
    }

    const imageType = imageRes.headers.get("content-type")?.split(";")[0] ?? "";
    if (imageType && !["image/png", "image/jpeg", "image/webp"].includes(imageType)) {
      throw new Error(`Image must be png/jpg/webp: ${imageType}`);
    }

    const imageExt = imageType
      ? imageType === "image/jpeg"
        ? "jpg"
        : imageType.split("/")[1]
      : "png";

    imagePathWithExt = `${imagePath}.${imageExt}`;

    await writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));
    await writeFile(imagePathWithExt, Buffer.from(await imageRes.arrayBuffer()));

    const filters = makeSpectrumFilters();

    const ffmpegSrc = getFfmpegPathStrict();
    ffmpegTmpPath = await ensureExecutable(ffmpegSrc);

    const cmd = [
      `"${ffmpegTmpPath}"`,
      `-y`,
      `-loop 1 -i "${imagePathWithExt}"`,
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
    await Promise.all(
      [audioPath, imagePathWithExt, outPath, ffmpegTmpPath]
        .filter(Boolean)
        .map(async (p) => {
          try {
            await unlink(p);
          } catch {}
        })
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify(
      {
        commit: process.env.VERCEL_GIT_COMMIT_SHA,
        env: process.env.VERCEL_ENV,
        cwd: process.cwd(),
        ffmpegPath
      },
      null,
      2
    ),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
