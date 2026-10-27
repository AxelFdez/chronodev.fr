import type { NextConfig } from 'next';

// Vide en production. L'aperçu GitHub Pages est servi sous /<dépôt>/ (docs/DEPLOIEMENT.md).
const basePath = process.env.BASE_PATH ?? '';

const nextConfig: NextConfig = {
  // Export statique : un fichier HTML par route, servi tel quel par nginx.
  output: 'export',
  basePath,
  // Inliné dans le bundle : fetch ne préfixe pas ses URL tout seul (lib/veille.ts).
  env: { BASE_PATH: basePath },
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
