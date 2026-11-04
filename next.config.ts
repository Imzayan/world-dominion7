import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* standalone is required BOTH by the Render/self-host path (`npm run build`)
     and by the OpenNext Cloudflare adapter (it reads .next/standalone/*). */
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
