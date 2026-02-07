// app/page.tsx
"use client";

import { useMemo, useState } from "react";

type UiState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "rendering" }
  | { kind: "done"; blobUrl: string; filename: string }
  | { kind: "error"; message: string };

export default function Page() {
  const [mp3, setMp3] = useState<File | null>(null);
  const [img, setImg] = useState<File | null>(null);
  const [ui, setUi] = useState<UiState>({ kind: "idle" });

  const canSubmit = useMemo(() => !!mp3 && !!img && ui.kind !== "uploading" && ui.kind !== "rendering", [mp3, img, ui.kind]);

  async function onSubmit() {
    if (!mp3 || !img) return;
    setUi({ kind: "uploading" });

    const fd = new FormData();
    fd.append("mp3", mp3);
    fd.append("image", img);

    try {
      setUi({ kind: "rendering" });
      const res = await fetch("/api/render", { method: "POST", body: fd });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const disp = res.headers.get("content-disposition") || "";
      const match = /filename="([^"]+)"/.exec(disp);
      const filename = match?.[1] || "output.mp4";

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      setUi({ kind: "done", blobUrl, filename });
    } catch (e: any) {
      setUi({ kind: "error", message: e?.message || "Render failed" });
    }
  }

  return (
    <div className="card">
      <div className="h1">MP3 → MP4 (1024×1024, 24fps) with Spectrum</div>
      <div className="small">
        Inputs: MP3 (≤ 8 min) + square image (png/jpg/webp). Output: H.264 + AAC MP4, duration matches the MP3.
      </div>
      <hr className="hr" />
      <div className="row">
        <div>
          <label>MP3 (max 8 minutes)</label>
          <input
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={(e) => setMp3(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <label>Square Image 1:1 (png/jpg/webp)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImg(e.target.files?.[0] || null)}
          />
        </div>

        <button disabled={!canSubmit} onClick={onSubmit}>
          Render MP4
        </button>

        {ui.kind === "idle" && <div className="status">Ready.</div>}
        {ui.kind === "uploading" && <div className="status">Uploading…</div>}
        {ui.kind === "rendering" && <div className="status">Rendering… (this can take a while)</div>}
        {ui.kind === "error" && <div className="status">Error: {ui.message}</div>}
        {ui.kind === "done" && (
          <div className="status">
            Done.{" "}
            <a href={ui.blobUrl} download={ui.filename}>
              Download MP4
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
