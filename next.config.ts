import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Engedélyez minden aldomaint és fődomaint
      },
      {
        protocol: 'http',
        hostname: '**', // Engedélyez minden nem biztonságos forrást is, ha szükséges
      },
    ],
  },
};

export default nextConfig;
