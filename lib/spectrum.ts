export function makeSpectrumFilters(): string {
  const w = 1024;
  const h = 1024;
  const barH = Math.round(h * 0.18);
  const margin = Math.round(w * 0.06);

  // 1) まず “汚さ” の原因になりやすい boxblur を弱める/やめる
  // 2) 代わりに showfreqs 出力を一度少し小さく作ってから拡大（アンチエイリアスっぽく効く）
  // 3) overlay を linear で合成してガタつき・色にじみを減らす
  // 4) さらに軽いぼかしが欲しければ gblur を極小で

  const outW = w - margin * 2;

  return [
    `[0:v]scale=${w}:${h},format=rgba[bg]`,

    // spectrum を “小さめ生成→拡大” でキレイに
    `[1:a]aformat=channel_layouts=mono,showfreqs=mode=line:ascale=log:size=512x${Math.max(1, Math.round(barH / 2))}:colors=white@0.55,` +
      `fps=24,format=rgba,scale=${outW}:${barH}:flags=lanczos,` +
      `gblur=sigma=0.35:steps=1[spectrum]`,

    // 合成を安定させる
    `[bg][spectrum]overlay=x=${margin}:y=${h - barH}:format=auto:eval=frame[v]`
  ].join(";");
}
