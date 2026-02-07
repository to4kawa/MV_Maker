// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "MP3 → MP4 Spectrum (1024²/24fps)",
  description: "Upload MP3 + square image, get MP4 with spectrum overlay."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
