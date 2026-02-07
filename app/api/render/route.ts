// app/api/render/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { getAudioDurationSeconds } from "@/lib/probe";
import { renderMp4WithSpectrum } from "@/lib/ffmpeg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randId() {
  return crypto.randomBytes(8).toString("hex");
}

async function writeWebFileToDisk(file: File, outPath: string) {
  const ab = await file.arrayBuffer();
  await fs.writeFile(outPath, Buffer.from(ab));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const mp3 = form.get("mp3");
    const image = form.get("image");

    if (!(mp3 instanceof File)) {
      return new NextResponse("Missing mp3 file", { status: 400 });
    }
    if (!(image instanceof File)) {
      return new NextResponse("Missing image file", { status: 400 });
    }

    const mp3Name = mp3.name.toLowerCase();
    const imgName = image.name.toLowerCase();

    if (!mp3Name.endsWith(".mp3") && mp3.type !== "audio/mpeg") {
      return new NextResponse("MP3 only", { status: 400 });
    }
    const okImg =
      imgName.endsWith(".png") ||
      imgName.endsWith(".jpg") ||
      imgName.endsWith(".jpeg") ||
      imgName.endsWith(".webp");
    if (!okImg) return new NextResponse("Image must be png/jpg/webp", { status: 400 });

    const tmp = os.tmpdir();
    const id = randId();

    const audioPath = path.join(tmp, `audio-${id}.mp3`);
    const imageExt = imgName.endsWith(".png") ? "png" : imgName.endsWith(".webp") ? "webp" : "jpg";
    const imagePath = path.join(tmp, `image-${id}.${imageExt}`);
    const outPath = path.join(tmp, `out-${id}.mp4`);

    await writeWebFileToDisk(mp3, audioPath);
    await writeWebFileToDisk(image, imagePath);

    const dur = await getAudioDurationSeconds(audioPath);
    if (dur > 8 * 60) {
      await cleanup([audioPath, imagePath, outPath]);
      return new NextResponse("MP3 longer than 8 minutes is not allowed", { status: 400 });
    }

    await renderMp4WithSpectrum({
      imagePath,
      audioPath,
      outPath,
      fps: 24,
      size: 1024
    });

    const buf = await fs.readFile(outPath);

    await cleanup([audioPath, imagePath, outPath]);

    const filename = `spectrum-${id}.mp4`;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store"
      }
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Render failed", { status: 500 });
  }
}

async function cleanup(paths: string[]) {
  await Promise.all(
    paths.map(async (p) => {
      try { await fs.unlink(p); } catch {}
    })
  );
}
