import { ImageResponse } from 'next/og';
import { getPage, getSiteSettings } from '@/content';
import { OG_CONTENT_TYPE, OG_SIZE, TextCard } from '@/lib/seo/og';

export const alt = 'Alex Nolasco Imóveis';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default async function PageOpenGraphImage({ params }: { params: Promise<{ page: string }> }) {
  const { page: slug } = await params;
  const [page, site] = await Promise.all([getPage(slug), getSiteSettings()]);
  return new ImageResponse(<TextCard creci={site.creci} eyebrow="Alex Nolasco Imóveis" title={page?.title ?? 'Página'} footer={page?.description} />, size);
}
