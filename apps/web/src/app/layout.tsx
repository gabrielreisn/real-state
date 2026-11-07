import type { Metadata } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { SITE_URL } from '@/content';
import './globals.css';

const schibsted = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-schibsted' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Alexandros Nolasco, Alex Nolasco, Imobiliária em Vitória - ES, Imobiliária em Jardim Camburi',
    template: '%s | Alex Nolasco Imóveis',
  },
  description:
    'Alexandros Nolasco, Imobiliária em Vitória - ES. Apartamentos em Jardim Camburi, Jardim da Penha, Vila Velha e Serra/ES.',
  openGraph: { locale: 'pt_BR', type: 'website', siteName: 'Alex Nolasco Imóveis' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={schibsted.variable}>
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3 focus:font-semibold focus:text-brand"
        >
          Ir para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
