"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";

export default function Home() {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const [audioBlob, setAudioBlob] = useState<PutBlobResult | null>(null);
  const [imageBlob, setImageBlob] = useState<PutBlobResult | null>(null);
  const [progress, setProgress] = useState<number>(0);

  async function onUpload() {
    const audio = audioRef.current?.files?.[0];
    const image = imageRef.current?.files?.[0];
    if (!audio || !image) return;

    setProgress(0);

    const audioRes = await upload(`audio/${audio.name}`, audio, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      multipart: true,
      onUploadProgress: (e) => setProgress(e.percentage)
    });

    const imageRes = await upload(`image/${image.name}`, image, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      multipart: false
    });

    setAudioBlob(audioRes);
    setImageBlob(imageRes);
  }

  async function onRender() {
    if (!audioBlob || !imageBlob) return;

    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audioUrl: audioBlob.url, imageUrl: imageBlob.url })
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const out = await res.blob();
    const url = URL.createObjectURL(out);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main style={{ padding: 16, display: "grid", gap: 12, maxWidth: 720 }}>
      <div>
        <div>MP3</div>
        <input ref={audioRef} type="file" accept="audio/mpeg" />
      </div>

      <div>
        <div>Image (png/jpg/webp)</div>
        <input ref={imageRef} type="file" accept="image/png,image/jpeg,image/webp" />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onUpload}>Upload to Blob</button>
        <button onClick={onRender} disabled={!audioBlob || !imageBlob}>
          Render
        </button>
      </div>

      <div>upload: {Math.round(progress)}%</div>

      {audioBlob && <div>audioUrl: {audioBlob.url}</div>}
      {imageBlob && <div>imageUrl: {imageBlob.url}</div>}
    </main>
  );
}
