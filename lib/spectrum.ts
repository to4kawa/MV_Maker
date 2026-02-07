export function makeSpectrumFilters(durationSec: number): string {
  const w = 1024
  const h = 1024
  const barH = Math.round(h * 0.18)
  const y = h - barH
  const color = "White@0.70"

  return [
    `[0:v]scale=${w}:${h},format=rgba[bg]`,
    `[1:a]aformat=channel_layouts=mono,showfreqs=mode=bar:fscale=log:ascale=log:fps=24:size=${w}x${barH}:colors=${color},format=rgba,split[core][glow]`,
    `[glow]gblur=sigma=8[glowb]`,
    `[bg][glowb]overlay=0:${y}[b1]`,
    `[b1][core]overlay=0:${y}:enable='between(t,0,${durationSec})'[v]`
  ].join(";")
}
