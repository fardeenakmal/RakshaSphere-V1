import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    const targetUrl = apiUrl.replace(/\/+$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: targetUrl.endsWith('/api/v1') ? `${targetUrl}/:path*` : `${targetUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
