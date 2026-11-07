'use client';

import type { MouseEvent } from 'react';
import type { Neighborhood } from '@/content/types';
import { plural } from '@/lib/format';
import { useSearch } from './SearchProvider';

/** Each neighborhood works as a category: choosing one filters the listings above. */
export function NeighborhoodLinks({ neighborhoods }: { neighborhoods: Neighborhood[] }) {
  const {
    state: { filters },
    actions,
  } = useSearch();

  const select = (event: MouseEvent, neighborhood: Neighborhood) => {
    event.preventDefault();
    actions.update({ cidade: neighborhood.city, bairro: neighborhood.name });
    actions.showResults();
  };

  return (
    <section aria-labelledby="bairros-titulo" className="bg-mist py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 id="bairros-titulo" className="text-[2rem] leading-tight font-bold tracking-tight md:text-[2.5rem]">
          Bairros
        </h2>
        <p className="mt-2 max-w-xl text-lg text-slate">Escolha um bairro para ver os imóveis à venda nele.</p>
        <ul className="mt-8 grid border-t border-line sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
          {neighborhoods.map((neighborhood) => {
            const current = filters.cidade === neighborhood.city && filters.bairro === neighborhood.name;
            return (
              <li key={neighborhood.slug} className="border-b border-line">
                <a
                  href={`/?cidade=${encodeURIComponent(neighborhood.city)}&bairro=${encodeURIComponent(neighborhood.name)}#imoveis`}
                  onClick={(event) => select(event, neighborhood)}
                  aria-current={current ? 'true' : undefined}
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <span>
                    <span className="block text-lg font-semibold group-hover:underline">{neighborhood.name}</span>
                    <span className="block text-slate">{neighborhood.city}</span>
                  </span>
                  <span className={current ? 'font-semibold text-brand' : 'text-slate'}>
                    {neighborhood.count} {plural(neighborhood.count, 'imóvel', 'imóveis')}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
