import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: ['*.trycloudflare.com', '192.168.154.21', '127.0.0.1'],
};

export default nextConfig;
