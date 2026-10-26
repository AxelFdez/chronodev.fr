import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Export statique : un fichier HTML par route, servi tel quel par nginx.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
