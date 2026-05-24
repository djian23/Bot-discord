import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@discord-manager/database", "@discord-manager/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },
};

export default nextConfig;
