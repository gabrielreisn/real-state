import { describe, expect, it, vi } from 'vitest';
import { toGalleryMedia } from './gallery';

vi.mock('./client', () => ({ sanityConfig: { projectId: 'test1234', dataset: 'development' } }));

describe('mixed property gallery', () => {
  const image = { _type: 'image', alt: 'Sala', asset: { _id: `image-${'a'.repeat(40)}-1600x900-jpg` } };
  const video = { _type: 'galleryVideo', alt: 'Visita ao imóvel', asset: { _id: 'file-video-mp4', url: 'https://cdn.sanity.io/files/test1234/development/video.mp4', mimeType: 'video/mp4' } };

  it('preserves photos, crops and image watermark support', () => {
    expect(toGalleryMedia({ ...image, watermark: true }, 'https://example.com/logo.png')).toMatchObject({ alt: 'Sala', width: undefined, watermark: 'https://example.com/logo.png' });
  });
  it('maps uploaded video files with an optional poster', () => {
    expect(toGalleryMedia({ ...video, poster: image })).toMatchObject({ kind: 'video', src: video.asset.url, mimeType: 'video/mp4', alt: 'Visita ao imóvel', poster: { alt: 'Sala' } });
  });
  it('only uses the generated cover belonging to the current video', () => {
    expect(toGalleryMedia({ ...video, poster: image, posterFor: video.asset._id })).toMatchObject({ poster: { alt: 'Sala' } });
    expect(toGalleryMedia({ ...video, poster: image, posterFor: 'file-replaced-mp4' })).toMatchObject({ poster: undefined });
  });
  it('ignores broken uploads and unsupported media', () => {
    expect(toGalleryMedia(null)).toBeNull();
    expect(toGalleryMedia({ ...video, asset: null })).toBeNull();
    expect(toGalleryMedia({ ...video, asset: { ...video.asset, mimeType: 'application/pdf' } })).toBeNull();
  });
});
