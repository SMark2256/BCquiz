import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
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
