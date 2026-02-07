# README.md

## What this does
Upload an MP3 (<= 8 minutes) + a square image (1:1 png/jpg/webp).
It renders a 1024x1024 MP4 (24fps) with:
- H.264 video
- AAC audio
- Duration exactly matches the MP3
- A bottom-bar spectrum visualizer (64 bands, log-ish feel, smoothed)

## Run locally
```bash
npm i
npm run dev
