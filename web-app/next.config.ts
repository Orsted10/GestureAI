import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',       // Static HTML export — required for Capacitor APK
  trailingSlash: true,    // Ensures consistent routing in the Android WebView
  images: {
    unoptimized: true,    // Required for static export (no Image Optimization API)
  },
};

export default nextConfig;
