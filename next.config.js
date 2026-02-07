// next.config.js  （ffmpeg のバイナリ同梱はここで強制する）
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/api/render": ["./node_modules/ffmpeg-static/**"]
    }
  }
};

module.exports = nextConfig;
