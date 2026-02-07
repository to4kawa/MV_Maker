import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const json = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      addRandomSuffix: true,
      allowedContentTypes: ["audio/mpeg", "image/png", "image/jpeg", "image/webp"],
      maximumSizeInBytes: 1024 * 1024 * 200
    }),
    onUploadCompleted: async () => {}
  });

  return NextResponse.json(json);
}
