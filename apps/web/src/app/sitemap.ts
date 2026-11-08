import type { MetadataRoute } from 'next';
import { getNeighborhoods, getProperties, getSitemapEntries, SITE_URL } from '@/content';
import { listingsHref } from '@/lib/listings-url';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ properties: listings, pages }, properties, neighborhoods] = await Promise.all([getSitemapEntries(), getProperties(), getNeighborhoods()]);
  const url = (href: string) => (href.startsWith('http') ? href : `${SITE_URL}${href}`);
  const cities = [...new Set(properties.map((property) => property.city))].filter(Boolean);
  const types = [...new Set(properties.map((property) => property.type))];

  return [
    { url: url('/'), changeFrequency: 'daily', priority: 1 },
    { url: url(listingsHref({})), changeFrequency: 'daily', priority: 0.9 },
    ...cities.map((city) => ({ url: url(listingsHref({ cidade: city })), changeFrequency: 'daily' as const, priority: 0.8 })),
    ...types.map((type) => ({ url: url(listingsHref({ tipo: type })), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...neighborhoods.map((neighborhood) => ({
      url: url(listingsHref({ cidade: neighborhood.city, bairro: neighborhood.name })),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...listings
      .filter((listing) => !listing.href.startsWith('http'))
      .map((listing) => ({ url: url(listing.href), lastModified: new Date(listing.updatedAt), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...pages.map((page) => ({ url: url(`/${page.slug}`), lastModified: new Date(page.updatedAt), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ];
}
