declare module "ffprobe-static" {
  const ffprobe: { path: string } | { path: string; version?: string } | undefined;
  export default ffprobe;
}
