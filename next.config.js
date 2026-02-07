/** @type {import('next').NextConfig} */
const nextConfig = {
  // Route Handlers の依存をバンドルしない（= node_modules をそのまま使う）
  serverExternalPackages: ['ffmpeg-static'],
};

module.exports = nextConfig;
