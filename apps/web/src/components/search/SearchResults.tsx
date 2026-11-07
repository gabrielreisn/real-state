'use client';

import { useId } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { whatsappLink } from '@/content/site';
import { filterChips, SORT_ORDERS, type SortOrder } from '@/lib/filters';
import { plural } from '@/lib/format';
import { PropertyCard } from '../PropertyCard';
import { RESULTS_HEADING_ID, useSearch } from './SearchProvider';

export function SearchResults({ whatsapp }: { whatsapp: string }) {
  const {
    state: { filters, sort },
    actions,
    meta: { results },
  } = useSearch();
  const sortId = useId();
  const chips = filterChips(filters);
  const count = results.length;
  const countLabel = `${count} ${plural(count, 'imóvel', 'imóveis')}`;

  return (
    <section id="imoveis" aria-labelledby={RESULTS_HEADING_ID} className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h2 id={RESULTS_HEADING_ID} tabIndex={-1} className="text-[2rem] leading-tight font-bold tracking-tight focus:outline-none md:text-[2.5rem]">
            {chips.length > 0 ? `${countLabel} para sua busca` : `${countLabel} à venda`}
          </h2>
          <div className="flex items-center gap-3">
            <label htmlFor={sortId} className="text-slate">
              Ordenar por
            </label>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => actions.setSort(event.target.value as SortOrder)}
              className="border border-line bg-white px-3 py-2"
            >
              {SORT_ORDERS.map((order) => (
                <option key={order.value} value={order.value}>
                  {order.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <ul className="flex flex-wrap gap-2" aria-label="Filtros ativos">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => actions.remove(chip.key)}
                    aria-label={`Remover filtro: ${chip.label}`}
                    className="inline-flex items-center gap-2 rounded-full border border-navy/25 bg-mist py-1.5 pr-3 pl-4 hover:border-navy"
                  >
                    {chip.label}
                    <FaXmark aria-hidden className="text-sm text-slate" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={actions.clear} className="ml-2 font-semibold text-brand underline underline-offset-4">
              Limpar tudo
            </button>
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite">
          {chips.length > 0 ? `${countLabel} encontrados` : ''}
        </p>

        {count > 0 ? (
          <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((property) => (
              <li key={property.id}>
                <PropertyCard property={property} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 max-w-2xl border-l-4 border-brand bg-mist p-6 md:p-8">
            <p className="text-xl font-semibold">Nenhum imóvel com essa combinação.</p>
            <p className="mt-2 text-slate">
              Remova um filtro acima, ou diga ao Alex o que você procura: ele também trabalha com imóveis que ainda não estão no site.
            </p>
            <a
              href={whatsappLink(whatsapp, 'Olá! Estou procurando um imóvel com estas características:')}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
            >
              Pedir pelo WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
