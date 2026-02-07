export function makeSpectrumFilters(): string {
  const w = 1024;
  const h = 1024;
  const barH = Math.round(h * 0.18); // bottom 18%
  const margin = Math.round(w * 0.06); // 6% side padding
  const color = "white@0.7";

  return [
    `[0:v]scale=${w}:${h},format=rgba[bg]`,
    `[1:a]aformat=channel_layouts=mono,showfreqs=mode=line:ascale=log:size=${w}x${barH}:colors=${color},fps=24,format=rgba,boxblur=2[spectrum]`,
    `[bg][spectrum]overlay=x=${margin}:y=${h - barH}:format=auto[v]`
  ].join(";");
}
