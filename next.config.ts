import type { NextConfig } from 'next';

// Para publicar en una subcarpeta (ej. GitHub Pages: usuario.github.io/repo) definí BASE_PATH=/repo
const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
