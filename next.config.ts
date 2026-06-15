import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Tree-shake large libraries so only the icons/utilities actually used
    // end up in the client bundle.
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Engedélyez minden aldomaint és fődomaint
      },
      {
        protocol: "http",
        hostname: "**", // Engedélyez minden nem biztonságos forrást is, ha szükséges
      },
    ],
  },
  async headers() {
    return [
      {
        // Long-term immutable caching for build assets and static files.
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
