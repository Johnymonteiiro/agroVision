import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Só vale no `next dev`: libera o túnel do ngrok para testar no celular (HMR e assets de dev).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev"],
};

export default nextConfig;
