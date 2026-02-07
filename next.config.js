/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/render": ["./node_modules/ffmpeg-static/**"],
  },
};

const ffmpeg = getFfmpegPath();
console.log("ffmpeg path:", ffmpeg);
await exec(`"${ffmpeg}" -version`);

module.exports = nextConfig;
