"use client"
import { useState } from "react"

export default function Home() {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [blobUrl, setBlobUrl] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("working")
    setMsg("")
    setBlobUrl("")

    const fd = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/render", { method: "POST", body: fd })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
      setStatus("done")
    } catch (err: any) {
      setStatus("error")
      setMsg(err.message || "Render failed")
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 480, margin: "auto" }}>
      <h1>MP3 → MP4 with spectrum</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            MP3 (≤8 min)&nbsp;
            <input required name="audio" type="file" accept=".mp3,audio/mpeg" />
          </label>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Square image (png/jpg/webp)&nbsp;
            <input required name="image" type="file" accept=".png,.jpg,.jpeg,.webp" />
          </label>
        </div>
        <button disabled={status !== "idle"} type="submit">
          {status === "working" ? "Working…" : "Generate MP4"}
        </button>
      </form>

      {status === "working" && <p>Rendering video…</p>}
      {status === "error" && <p style={{ color: "red" }}>{msg}</p>}
      {status === "done" && (
        <p>
          <a href={blobUrl} download="output.mp4">Download MP4</a>
        </p>
      )}
    </div>
  )
}
