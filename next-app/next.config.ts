import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "pg-connect.s3.ap-south-1.amazonaws.com",
      "res.cloudinary.com",
      "assets.aceternity.com",
    ],
  },
};

export default nextConfig;
