import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  serverExternalPackages: ['@google/generative-ai', 'firebase-admin']
};

export default nextConfig;
