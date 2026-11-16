import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

// Local development shares the repo-root .env with the other apps. Deployments (Vercel, Docker)
// set real environment variables instead, and those take precedence over the file.
const rootEnv = path.join(import.meta.dirname, '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const config: NextConfig = {
  output: 'standalone',
  redirects() {
    return [
      { source: '/contato', destination: '/sobre#contato', permanent: true },
      { source: '/mobile/contato', destination: '/sobre#contato', permanent: true },
      { source: '/bairro/:cidade/:bairro', destination: '/imoveis/:cidade/:bairro', permanent: true },
      { source: '/mobile/bairro/:cidade/:bairro', destination: '/imoveis/:cidade/:bairro', permanent: true },
      { source: '/cidade/:cidade', destination: '/imoveis/:cidade', permanent: true },
      { source: '/mobile/cidade/:cidade', destination: '/imoveis/:cidade', permanent: true },
    ];
  },
  // Trace dependencies from the workspace root so the standalone build includes hoisted pnpm packages.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  images: {
    loader: 'custom',
    loaderFile: './src/lib/sanity-image-loader.ts',
    // Thumbnails, default, and the large gallery photo.
    qualities: [60, 75, 85],
  },
};

export default config;
