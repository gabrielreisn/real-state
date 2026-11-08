import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { Neighborhoods } from '@/components/Neighborhoods';
import { PropertyCard } from '@/components/PropertyCard';
import { CodeLookup } from '@/components/search/CodeLookup';
import { SearchSentence } from '@/components/search/SearchSentence';
import { JsonLd } from '@/components/JsonLd';
import { getFeaturedProperties, getNeighborhoods, getProperties, SITE_URL } from '@/content';
import { hasActiveFilters, parseFilters, parseSort } from '@/lib/filters';
import { LISTINGS_PATH, listingsHref } from '@/lib/listings-url';
import { homeGraph } from '@/lib/seo/jsonld';
import { openGraphDefaults } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...openGraphDefaults, url: '/', title: 'Imóveis à venda na Grande Vitória' },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, properties, featured, neighborhoods] = await Promise.all([
    searchParams,
    getProperties(),
    getFeaturedProperties(),
    getNeighborhoods(),
  ]);

  // Searches used to live on the home page (/?cidade=…); old links go to the listings page.
  const legacy = parseFilters(params);
  if (hasActiveFilters(legacy) || params.ordem) permanentRedirect(listingsHref(legacy, parseSort(params)));

  const newest = properties.slice(0, 8);

  return (
    <>
      <section aria-labelledby="busca-titulo" className="bg-navy text-white [--focus:#fff]">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 md:px-8 md:pt-16 md:pb-8">
          <h1 id="busca-titulo" className="mb-5 text-lg font-medium text-on-navy md:text-xl">
            Imóveis à venda na Grande Vitória
          </h1>
          <SearchSentence properties={properties} />
          <CodeLookup listings={properties.map(({ code, href }) => ({ code, href }))} />
        </div>
      </section>

      <FeaturedCarousel properties={featured} />

      <section aria-labelledby="recentes-titulo" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="recentes-titulo" className="text-[2rem] leading-tight font-bold tracking-tight md:text-[2.5rem]">
              Anunciados recentemente
            </h2>
            <Link href={LISTINGS_PATH} className="font-semibold text-brand underline underline-offset-4">
              Ver todos os {properties.length} imóveis
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {newest.map((property) => (
              <li key={property.id}>
                <PropertyCard property={property} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Neighborhoods neighborhoods={neighborhoods} />
      <JsonLd data={homeGraph({ siteUrl: SITE_URL, featured, neighborhoods })} />
    </>
  );
}
