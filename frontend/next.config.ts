import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
    
    // Prevent Vercel from throwing DNS_HOSTNAME_RESOLVED_PRIVATE when proxying to localhost / private IP hostnames
    const isPrivateHost = !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
    if (process.env.VERCEL && isPrivateHost) {
      return [];
    }

    const targetUrl = apiUrl || 'http://localhost:8080';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${targetUrl.replace(/\/+$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
