import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    domains: [
      "pg-connect.s3.ap-south-1.amazonaws.com",
      "res.cloudinary.com",
      "assets.aceternity.com",
    ],
  },
};

export default nextConfig;
