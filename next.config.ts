import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // pdf-parse uses pdfjs-dist which relies on native Node.js internals.
  // Bundling it with webpack breaks it in production — keep it as a
  // native require so Node resolves it at runtime.
  serverExternalPackages: ["pdf-parse"],
};
export default nextConfig;
