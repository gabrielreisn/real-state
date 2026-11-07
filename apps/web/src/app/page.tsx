import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { CodeLookup } from '@/components/search/CodeLookup';
import { NeighborhoodLinks } from '@/components/search/NeighborhoodLinks';
import { SearchProvider } from '@/components/search/SearchProvider';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchSentence } from '@/components/search/SearchSentence';
import { getFeaturedProperties, getNeighborhoods, getProperties, getSiteSettings } from '@/content';
import { parseFilters, parseSort } from '@/lib/filters';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, properties, featured, neighborhoods, settings] = await Promise.all([
    searchParams,
    getProperties(),
    getFeaturedProperties(),
    getNeighborhoods(),
    getSiteSettings(),
  ]);
  const filters = parseFilters(params);
  const sort = parseSort(params);

  return (
    // Keyed on the query so links that change it (header menu, breadcrumbs) start a fresh search.
    <SearchProvider key={JSON.stringify([filters, sort])} properties={properties} initialFilters={filters} initialSort={sort}>
      <section aria-labelledby="busca-titulo" className="bg-navy text-white [--focus:#fff]">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 md:px-8 md:pt-16 md:pb-8">
          <h1 id="busca-titulo" className="mb-5 text-lg font-medium text-on-navy md:text-xl">
            Imóveis à venda na Grande Vitória
          </h1>
          <SearchSentence />
          <CodeLookup />
        </div>
      </section>
      <FeaturedCarousel properties={featured} />
      <SearchResults whatsapp={settings.whatsapp} />
      <NeighborhoodLinks neighborhoods={neighborhoods} />
    </SearchProvider>
  );
}
