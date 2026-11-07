import { createImageUrlBuilder } from '@sanity/image-url';
import type { Image } from '@/content/types';
import { sanityConfig } from './client';

const builder = createImageUrlBuilder(sanityConfig);

export type SanityImage = {
  alt: string | null;
  crop?: unknown;
  hotspot?: unknown;
  asset: { _id: string; metadata?: { lqip?: string; dimensions?: { width: number; height: number } } } | null;
} | null;

export const IMAGE_PROJECTION = /* groq */ `{ alt, crop, hotspot, asset->{ _id, metadata { lqip, dimensions { width, height } } } }`;

/**
 * The base CDN URL keeps the editor's crop; size, quality and format are added per
 * request by the image loader (src/lib/sanity-image-loader.ts).
 */
export function toImage(source: SanityImage): Image | null {
  if (!source?.asset) return null;
  return {
    src: builder.image(source as Parameters<typeof builder.image>[0]).url(),
    alt: source.alt ?? '',
    width: source.asset.metadata?.dimensions?.width,
    height: source.asset.metadata?.dimensions?.height,
    lqip: source.asset.metadata?.lqip,
  };
}
