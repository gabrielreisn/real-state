import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { Neighborhoods } from '@/components/Neighborhoods';
import { PropertyCard } from '@/components/PropertyCard';
import { HomeSearch } from '@/components/search/HomeSearch';
import { JsonLd } from '@/components/JsonLd';
import { getFeaturedProperties, getHeroImage, getNeighborhoods, getProperties, SITE_URL } from '@/content';
import { hasActiveFilters, parseFilters, parseSort } from '@/lib/filters';
import { LISTINGS_PATH, listingsHref } from '@/lib/listings-url';
import { getPropertyViews } from '@/lib/property-views';
import { recentAndPopular } from '@/lib/recent-and-popular';
import { suggestionListing } from '@/lib/search-suggestions';
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
  const [params, properties, featured, neighborhoods, heroImage, views] = await Promise.all([
    searchParams,
    getProperties(),
    getFeaturedProperties(),
    getNeighborhoods(),
    getHeroImage(),
    getPropertyViews(),
  ]);

  // Searches used to live on the home page (/?cidade=…); old links go to the listings page.
  const legacy = parseFilters(params);
  if (hasActiveFilters(legacy) || params.ordem) permanentRedirect(listingsHref(legacy, parseSort(params)));

  const homeListings = recentAndPopular(properties, views, 8);
  const background = heroImage ?? featured[0]?.image;

  return (
    <>
      {/* Above the next sections so the suggestions can open over them. */}
      <section aria-labelledby="busca-titulo" className="relative z-10 bg-navy text-white [--focus:#fff]">
        {background ? (
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <Image src={background.src} alt="" fill sizes="100vw" loading="eager" fetchPriority="high" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-navy/90 via-navy/60 to-navy/45" />
          </div>
        ) : null}
        <div className="relative mx-auto flex min-h-[24rem] max-w-7xl flex-col justify-center px-4 py-14 md:min-h-[32rem] md:px-8 md:py-20">
          <h1 id="busca-titulo" className="mb-7 max-w-3xl text-[2rem] leading-tight font-bold tracking-tight text-balance md:text-[3.25rem]">
            Imóveis à venda na Grande Vitória
          </h1>
          <HomeSearch listings={properties.map(suggestionListing)} />
        </div>
      </section>

      <FeaturedCarousel properties={featured} />

      <section aria-labelledby="recentes-titulo" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="recentes-titulo" className="text-[2rem] leading-tight font-bold tracking-tight md:text-[2.5rem]">
              Novos e mais procurados
            </h2>
            <Link href={LISTINGS_PATH} className="font-semibold text-brand underline underline-offset-4">
              Ver todos os {properties.length} imóveis
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {homeListings.map((property) => (
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
