import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Same-origin API base keeps the session cookie first-party — the
        // browser always talks to /api/v1 on its own origin, never the
        // backend host directly.
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
