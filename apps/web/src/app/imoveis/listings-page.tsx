// Shared by /imoveis, /imoveis/[cidade] and /imoveis/[cidade]/[bairro].
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { FaXmark } from 'react-icons/fa6';
import { FilterBar } from '@/components/listings/FilterBar';
import { Pagination } from '@/components/listings/Pagination';
import { PropertyCard } from '@/components/PropertyCard';
import { JsonLd } from '@/components/JsonLd';
import { getProperties, getSiteSettings, SITE_URL, whatsappLink } from '@/content';
import { filterChips, filterProperties, parseFilters, parseSort, removeFilter, searchOptions, sortProperties } from '@/lib/filters';
import { listingsHeading, listingsHref, PAGE_SIZE, parsePage, resolveLocation } from '@/lib/listings-url';
import { listingsGraph } from '@/lib/seo/jsonld';
import { openGraphDefaults } from '@/lib/seo/metadata';
import { ogPhotoImage } from '@/lib/seo/og';

/** Path segments after /imoveis ([] | [city] | [city, neighborhood]) plus the query string. */
export type ListingsProps = {
  segments: Promise<string[]>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function describe(filters: Parameters<typeof listingsHeading>[0], results: { price: number | null }[]) {
  const prices = results.map((property) => property.price).filter((price): price is number => price !== null);
  const from = prices.length ? Math.min(...prices) : null;
  return `${listingsHeading(filters, results.length)}${from ? `, a partir de R$ ${from.toLocaleString('pt-BR')}` : ''}. Fotos, preços e detalhes com Alex Nolasco, consultor imobiliário (Creci/ES 12470-F).`;
}

async function loadSearch({ segments, searchParams }: ListingsProps) {
  const [local, query, properties] = await Promise.all([segments, searchParams, getProperties()]);
  const location = resolveLocation(local, properties);
  if (location === null) notFound();

  const fromQuery = parseFilters(query);
  // Location in the query (old links, or the filter form without JavaScript) moves into the path.
  if (query.local !== undefined || query.cidade !== undefined || query.bairro !== undefined) {
    permanentRedirect(listingsHref(fromQuery, parseSort(query), parsePage(query.pagina)));
  }

  const filters = { ...fromQuery, cidade: location.cidade, bairro: location.bairro };
  const sort = parseSort(query);
  const page = parsePage(query.pagina);
  const results = sortProperties(filterProperties(properties, filters), sort);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  if (page > pageCount) notFound();

  return { properties, filters, sort, page, pageCount, results };
}

export async function listingsMetadata(props: ListingsProps): Promise<Metadata> {
  const { filters, sort, page, results } = await loadSearch(props);
  const heading = listingsHeading(filters);
  const description = describe(filters, results);
  return {
    title: page > 1 ? `${heading} – página ${page}` : heading,
    description,
    alternates: { canonical: listingsHref(filters, sort, page) },
    // The newest listing's photo; searches without results fall back to the site card.
    openGraph: {
      ...openGraphDefaults,
      title: heading,
      description,
      url: listingsHref(filters, sort, page),
      images: results[0] ? [ogPhotoImage(results[0].image.src, heading)] : ['/opengraph-image'],
    },
  };
}

export async function ListingsPage(props: ListingsProps) {
  const [{ properties, filters, sort, page, pageCount, results }, site] = await Promise.all([loadSearch(props), getSiteSettings()]);
  const options = searchOptions(properties);
  const chips = filterChips(filters);
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Internal links that help both people and crawlers move between places.
  const nearby = filters.cidade
    ? options.cities.find((city) => city.name === filters.cidade)?.neighborhoods.filter((name) => name !== filters.bairro) ?? []
    : [];

  const breadcrumbs = [
    { label: 'Início', href: '/' },
    { label: 'Imóveis à venda', href: '/imoveis' },
    ...(filters.cidade ? [{ label: filters.cidade, href: listingsHref({ cidade: filters.cidade }) }] : []),
    ...(filters.bairro ? [{ label: filters.bairro, href: listingsHref({ cidade: filters.cidade, bairro: filters.bairro }) }] : []),
  ];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
        <nav aria-label="Trilha de navegação" className="text-sm text-slate">
          <ol className="flex flex-wrap gap-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex gap-x-2">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-brand hover:underline">
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-3 text-[1.75rem] leading-tight font-bold tracking-tight md:text-[2.5rem]">{listingsHeading(filters, results.length)}</h1>
      </div>

      <div className="sticky top-0 z-20 mt-4 border-y border-line bg-white/95 backdrop-blur [--focus:var(--color-brand)]">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <FilterBar options={options} filters={filters} sort={sort} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-8">
        {chips.length > 0 ? (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <ul className="flex flex-wrap gap-2" aria-label="Filtros ativos">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <Link
                    href={listingsHref(removeFilter(filters, chip.key), sort)}
                    aria-label={`Remover filtro: ${chip.label}`}
                    className="inline-flex items-center gap-2 rounded-full border border-navy/25 bg-mist py-1.5 pr-3 pl-4 hover:border-navy"
                  >
                    {chip.label}
                    <FaXmark aria-hidden className="text-sm text-slate" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={listingsHref({}, sort)} className="ml-2 font-semibold text-brand underline underline-offset-4">
              Limpar tudo
            </Link>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <>
            <p className="mb-6 text-slate">
              {results.length > PAGE_SIZE
                ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + visible.length} de ${results.length}`
                : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`}
            </p>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visible.map((property) => (
                <li key={property.id}>
                  <PropertyCard property={property} />
                </li>
              ))}
            </ul>
            <Pagination current={page} total={pageCount} href={(n) => listingsHref(filters, sort, n)} />
          </>
        ) : (
          <div className="max-w-2xl border-l-4 border-brand bg-mist p-6 md:p-8">
            <p className="text-xl font-semibold">Nenhum imóvel com essa combinação.</p>
            <p className="mt-2 text-slate">
              Remova um filtro acima, ou diga ao Alex o que você procura: ele também trabalha com imóveis que ainda não estão no site.
            </p>
            <a
              href={whatsappLink(site.whatsapp, 'Olá! Estou procurando um imóvel com estas características:')}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Pedir pelo WhatsApp
            </a>
          </div>
        )}

        {nearby.length > 0 || !filters.cidade ? (
          <section aria-labelledby="explorar-titulo" className="mt-20 border-t border-line pt-10">
            <h2 id="explorar-titulo" className="text-xl font-bold">
              {filters.cidade ? `Outros bairros em ${filters.cidade}` : 'Imóveis por cidade'}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {(filters.cidade
                ? nearby.map((name) => ({ name, href: listingsHref({ cidade: filters.cidade, bairro: name }) }))
                : options.cities.map((city) => ({ name: city.name, href: listingsHref({ cidade: city.name }) }))
              ).map((place) => (
                <li key={place.href}>
                  <Link href={place.href} className="text-slate underline underline-offset-4 hover:text-brand">
                    {place.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <JsonLd
        data={listingsGraph({
          siteUrl: SITE_URL,
          url: listingsHref(filters, sort, page),
          name: listingsHeading(filters),
          description: describe(filters, results),
          total: results.length,
          properties: visible,
          offset: (page - 1) * PAGE_SIZE,
          breadcrumbs,
        })}
      />
    </>
  );
}
