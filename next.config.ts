import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "pub-6ae5048278f24ad48b62dc77072943aa.r2.dev" },
      { protocol: "https", hostname: "www.tbuc.co.kr" },
    ],
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [128, 256, 384, 512],
  },
};

export default nextConfig;
