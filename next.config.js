/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/render": ["./node_modules/ffmpeg-static/**"],
  },
};

module.exports = nextConfig;
