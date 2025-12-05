import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Fast Refresh (Hot Reload) - enabled by default but explicitly set
  reactStrictMode: true,

  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  // Turbopack has built-in hot reload optimizations, so no custom config needed
  turbopack: {},

  // Webpack configuration (only used if --webpack flag is passed)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize hot reload performance for webpack mode
      config.watchOptions = {
        poll: 1000, // Check for changes every second (useful for some file systems)
        aggregateTimeout: 300, // Delay before rebuilding once the first file changed
        ignored: /node_modules/, // Ignore node_modules for faster reload
      };
    }
    return config;
  },
};

export default nextConfig;
