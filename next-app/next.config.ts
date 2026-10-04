import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const s3Host = process.env.AWS_BUCKET_NAME && process.env.AWS_REGION
  ? `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
  : undefined;
const publicBaseHost = process.env.AWS_PUBLIC_BASE_URL
  ? new URL(process.env.AWS_PUBLIC_BASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "pg-connect.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(s3Host ? [{ protocol: "https" as const, hostname: s3Host }] : []),
      ...(publicBaseHost ? [{ protocol: "https" as const, hostname: publicBaseHost }] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Clean URLs for policy pages (required by payment gateways).
    return [
      { source: "/terms", destination: "/t&c" },
      { source: "/privacy", destination: "/pp" },
      { source: "/refund-policy", destination: "/c&r" },
      { source: "/contact", destination: "/cu" },
      { source: "/shipping-policy", destination: "/s&d" },
    ];
  },
  async redirects() {
    return [
      { source: "/profile", destination: "/account", permanent: true },
      { source: "/dashboard/user", destination: "/account", permanent: true },
      { source: "/dashboard/chat", destination: "/chat", permanent: true },
    ];
  },
};

export default nextConfig;
