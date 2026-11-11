import type { GalleryMedia } from '@/content/types';
import { IMAGE_PROJECTION, toImage, type SanityImage } from './image';

export type RawGalleryMedia = NonNullable<SanityImage> & {
  _type?: string;
  _key?: string;
  asset: (NonNullable<NonNullable<SanityImage>['asset']> & { url?: string; mimeType?: string }) | null;
  poster?: SanityImage;
  posterFor?: string;
};

export const GALLERY_PROJECTION = /* groq */ `{
  _type, _key, alt, watermark, crop, hotspot,
  asset->{ _id, url, mimeType, metadata { lqip, dimensions { width, height } } },
  posterFor, "poster": poster ${IMAGE_PROJECTION}
}`;

export function toGalleryMedia(source: RawGalleryMedia | null, watermark?: string): GalleryMedia | null {
  if (!source?.asset) return null;
  if (source._type !== 'galleryVideo') {
    const image = toImage(source, watermark);
    return image ? { ...image, key: source._key } : null;
  }
  if (!source.asset.url || !['video/mp4', 'video/webm'].includes(source.asset.mimeType ?? '')) return null;
  return {
    kind: 'video', key: source._key, src: source.asset.url, mimeType: source.asset.mimeType!,
    alt: source.alt || 'Vídeo do imóvel', poster: source.posterFor && source.posterFor !== source.asset._id ? undefined : toImage(source.poster ?? null) ?? undefined,
  };
}
