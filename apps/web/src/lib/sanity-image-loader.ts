'use client';

import type { ImageLoaderProps } from 'next/image';

/**
 * Every next/image request goes to Sanity's image CDN, which resizes and re-encodes on the fly:
 * `auto=format` serves AVIF or WebP to browsers that accept them, `q` sets the quality and
 * `fit=max` never upscales. Next's own optimizer is not involved.
 */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps) {
  const url = new URL(src, 'https://cdn.sanity.io');
  if (url.hostname !== 'cdn.sanity.io') return `${src}?w=${width}`;
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality ?? 75));
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'max');
  return url.toString();
}
