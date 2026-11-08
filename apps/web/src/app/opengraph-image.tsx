import { ImageResponse } from 'next/og';
import { getProperties, getSiteSettings } from '@/content';
import { OG_CONTENT_TYPE, OG_SIZE, TextCard } from '@/lib/seo/og';

export const alt = 'Alex Nolasco Imóveis: imóveis à venda na Grande Vitória';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default async function OpenGraphImage() {
  const [site, properties] = await Promise.all([getSiteSettings(), getProperties()]);
  return new ImageResponse(
    <TextCard
      creci={site.creci}
      eyebrow="Vitória · Vila Velha · Serra · Guarapari"
      title="Imóveis à venda na Grande Vitória"
      footer={`${properties.length} imóveis com fotos, preços e atendimento personalizado`}
    />,
    size,
  );
}
