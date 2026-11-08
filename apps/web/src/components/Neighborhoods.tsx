import Link from 'next/link';
import type { Neighborhood } from '@/content/types';
import { plural } from '@/lib/format';
import { listingsHref } from '@/lib/listings-url';

function NeighborhoodItem({ neighborhood }: { neighborhood: Neighborhood }) {
  return (
    <li className="border-b border-line">
      <Link
        href={listingsHref({ cidade: neighborhood.city, bairro: neighborhood.name })}
        className="group flex items-baseline justify-between gap-4 py-4"
      >
        <span>
          <span className="block text-lg font-semibold group-hover:underline">{neighborhood.name}</span>
          <span className="block text-slate">{neighborhood.city}</span>
        </span>
        <span className="text-slate">
          {neighborhood.count} {plural(neighborhood.count, 'imóvel', 'imóveis')}
        </span>
      </Link>
    </li>
  );
}

const grid = 'grid sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4';

/** Each neighborhood links to its own listings page, e.g. /imoveis/vila-velha/praia-da-costa. */
export function Neighborhoods({ neighborhoods }: { neighborhoods: Neighborhood[] }) {
  const [first, rest] = [neighborhoods.slice(0, 12), neighborhoods.slice(12)];
  return (
    <section aria-labelledby="bairros-titulo" className="bg-mist py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 id="bairros-titulo" className="text-[2rem] leading-tight font-bold tracking-tight md:text-[2.5rem]">
          Bairros
        </h2>
        <p className="mt-2 max-w-xl text-lg text-slate">Escolha um bairro para ver os imóveis à venda nele.</p>
        <ul className={`mt-8 border-t border-line ${grid}`}>
          {first.map((neighborhood) => (
            <NeighborhoodItem key={`${neighborhood.city}/${neighborhood.slug}`} neighborhood={neighborhood} />
          ))}
        </ul>
        {rest.length > 0 ? (
          // Native disclosure: works without JavaScript and keeps every link in the HTML for crawlers.
          <details className="group mt-2">
            <summary className="mt-6 cursor-pointer list-none font-semibold underline underline-offset-4 hover:text-brand">
              <span className="group-open:hidden">Ver todos os {neighborhoods.length} bairros</span>
              <span className="hidden group-open:inline">Mostrar menos bairros</span>
            </summary>
            <ul className={`mt-4 border-t border-line ${grid}`}>
              {rest.map((neighborhood) => (
                <NeighborhoodItem key={`${neighborhood.city}/${neighborhood.slug}`} neighborhood={neighborhood} />
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
