import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

const nextConfig: NextConfig = {
  /* Only use standalone output for Docker environments, omit on Vercel to prevent nft tracing ENOENT errors */
  ...(isVercel ? {} : { output: 'standalone' }),
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
