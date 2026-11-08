import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/seo/metadata';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Alex Nolasco',
    description: 'Imóveis à venda na Grande Vitória - ES',
    lang: 'pt-BR',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f1a3a',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
