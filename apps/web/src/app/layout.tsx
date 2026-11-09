import type { Metadata, Viewport } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { Header } from '@/components/Header';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { JsonLd } from '@/components/JsonLd';
import { PreviewBanner } from '@/components/PreviewBanner';
import { getListingStats, getSiteSettings, SITE_URL } from '@/content';
import { indexable, openGraphDefaults, SITE_NAME } from '@/lib/seo/metadata';
import { siteGraph } from '@/lib/seo/jsonld';
import { SanityLive } from '@/lib/sanity/live';
import './globals.css';

const schibsted = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-schibsted' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Alex Nolasco Imóveis | Imóveis à venda em Vitória, Vila Velha e Serra - ES',
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Apartamentos, casas, terrenos e imóveis comerciais à venda na Grande Vitória com Alexandros Nolasco, consultor imobiliário (Creci/ES 12470-F).',
  applicationName: SITE_NAME,
  authors: [{ name: 'Alexandros Nolasco' }],
  creator: 'Alexandros Nolasco',
  publisher: 'Alexandros Nolasco',
  category: 'real estate',
  openGraph: openGraphDefaults,
  twitter: { card: 'summary_large_image' },
  robots: indexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
    : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0f1a3a', colorScheme: 'light' };


export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, { cities, priceRange }, { isEnabled: preview }] = await Promise.all([getSiteSettings(), getListingStats(), draftMode()]);
  const graph = siteGraph({ siteUrl: SITE_URL, site, cities, priceRange });

  return (
    <html lang="pt-BR" className={schibsted.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3 focus:font-semibold focus:text-brand"
        >
          Ir para o conteúdo
        </a>
        <Header />
        {/* Grows to fill short pages, so the footer always sits at the bottom of the window. */}
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
        <JsonLd data={graph} />
        {!preview && <GoogleAnalytics />}
        {/* Refreshes cached content when it changes in Sanity; in preview mode, on every draft edit. */}
        <SanityLive />
        {preview ? (
          <>
            <VisualEditing />
            <PreviewBanner />
          </>
        ) : null}
      </body>
    </html>
  );
}
