import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
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
