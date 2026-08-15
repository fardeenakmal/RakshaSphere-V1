import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'standalone',
  async rewrites() {
    // Use an environment variable for production, fallback to localhost for dev
    const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';
    
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
