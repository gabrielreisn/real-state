import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanityFetch } from '@/lib/sanity/live';
import { getFeaturedProperties, getProperties, getPropertyDetail, getPropertyDetailParams, getListingStats, getPropertyTypes, getNeighborhoods, getSitemapEntries } from './index';

vi.mock('@/lib/sanity/live', () => ({ sanityFetch: vi.fn() }));
vi.mock('@/lib/sanity/image', () => ({ IMAGE_PROJECTION: '{asset}', toImage: (value: { asset?: object; alt?: string } | null) => value?.asset ? { src: 'https://example.com/photo.jpg', alt: value.alt ?? '' } : null }));

beforeEach(() => vi.clearAllMocks());

describe('property availability', () => {
  it('excludes unavailable properties from listing, detail, taxonomy, stats and sitemap queries', async () => {
    const calls = [
      [() => getProperties(), []], [() => getPropertyDetail('1170'), null], [() => getPropertyDetailParams(), []],
      [() => getPropertyTypes(), []], [() => getNeighborhoods(), []], [() => getSitemapEntries(), { properties: [], pages: [] }],
      [() => getListingStats(), { cities: [], minPrice: null, maxPrice: null }],
    ] as const;
    for (const [run, result] of calls) {
      vi.mocked(sanityFetch).mockResolvedValueOnce(result);
      await run();
      expect(vi.mocked(sanityFetch).mock.lastCall?.[0]).toContain('available != false');
    }
  });
  it('also removes unavailable hand-picked featured properties while retaining legacy defaults', async () => {
    const photo = { asset: { _id: 'test' }, alt: 'Foto' };
    const property = { id: '1170', code: '1170', slug: 'apartamento', image: photo, photos: [], watermark: null };
    vi.mocked(sanityFetch).mockResolvedValueOnce([{ ...property, available: false }, { ...property, id: 'legacy' }, { ...property, id: 'available', available: true }]);
    expect((await getFeaturedProperties()).map(p => p.id)).toEqual(['legacy', 'available']);
  });
});
