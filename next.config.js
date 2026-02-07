/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next14系の「サーバ側バンドルから外す」指定
    serverComponentsExternalPackages: ["ffmpeg-static"],
  },
};

module.exports = nextConfig;
