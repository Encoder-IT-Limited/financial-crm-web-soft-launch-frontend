import type { NextConfig } from "next";
import os from "node:os";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4001";

/** All local IPv4s so LAN devices can load /_next in `next dev`. */
function lanHosts(): string[] {
  const hosts = new Set<string>(["localhost", "127.0.0.1", "0.0.0.0"]);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) hosts.add(net.address);
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanHosts(),
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
