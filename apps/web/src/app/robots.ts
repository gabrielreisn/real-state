import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content';
import { indexable } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
