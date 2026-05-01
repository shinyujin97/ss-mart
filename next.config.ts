import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // public/products/ 폴더 로컬 이미지는 unoptimized로 처리
    unoptimized: true,
  },
};

export default nextConfig;
