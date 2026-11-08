'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useId, useTransition } from 'react';
import {
  bedroomsLabel,
  locationValue,
  parseLocation,
  type PropertyFilters,
  type SearchOptions,
  SORT_ORDERS,
  type SortOrder,
} from '@/lib/filters';
import { formatPriceShort } from '@/lib/format';
import { LISTINGS_PATH, listingsHref } from '@/lib/listings-url';

function Control({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="shrink-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

const pill =
  // field-sizing fits each pill to its chosen value instead of its longest option.
  'max-w-72 appearance-none rounded-full border border-navy/25 bg-white bg-[length:0.7rem] bg-[right_0.9rem_center] bg-no-repeat py-2 pr-9 pl-4 font-medium text-ellipsis transition-colors duration-150 [field-sizing:content] hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-mist';
// A small chevron drawn in CSS so the native select keeps its accessibility.
const chevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%230f1a3a' stroke-width='1.8'/%3E%3C/svg%3E\")",
};

/**
 * Every change navigates to the new search URL; the server renders the results. Without
 * JavaScript the same controls submit as a GET form.
 */
export function FilterBar({ options, filters, sort }: { options: SearchOptions; filters: PropertyFilters; sort: SortOrder }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (next: PropertyFilters, nextSort: SortOrder = sort) =>
    startTransition(() => router.push(listingsHref(next, nextSort), { scroll: false }));
  // Changing any filter drops a code search, which would otherwise hide every other result.
  const update = (patch: Partial<PropertyFilters>) => go({ ...filters, codigo: undefined, ...patch });
  const bedrooms = filters.dormitorios === undefined ? '' : `${filters.dormitorios}${filters.dormitoriosOuMais ? '+' : ''}`;

  return (
    <form action={LISTINGS_PATH} method="get" onSubmit={(event) => event.preventDefault()} aria-busy={pending}>
      <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-4 py-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <Control label="Cidade ou bairro">
          {(id) => (
            <select
              id={id}
              name="local"
              value={locationValue(filters)}
              aria-current={Boolean(filters.cidade)}
              onChange={(event) => update({ cidade: undefined, bairro: undefined, ...parseLocation(event.target.value) })}
              className={pill}
              style={chevron}
            >
              <option value="">Toda a Grande Vitória</option>
              {options.cities.map((city) => (
                <optgroup key={city.name} label={city.name}>
                  <option value={`c|${city.name}`}>{city.name}, todos os bairros</option>
                  {city.neighborhoods.map((neighborhood) => (
                    <option key={neighborhood} value={`b|${city.name}|${neighborhood}`}>
                      {neighborhood}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </Control>
        <Control label="Tipo de imóvel">
          {(id) => (
            <select
              id={id}
              name="tipo"
              value={filters.tipo ?? ''}
              aria-current={Boolean(filters.tipo)}
              onChange={(event) => update({ tipo: event.target.value || undefined })}
              className={pill}
              style={chevron}
            >
              <option value="">Todos os tipos</option>
              {options.types.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          )}
        </Control>
        <Control label="Quartos">
          {(id) => (
            <select
              id={id}
              name="dormitorios"
              value={bedrooms}
              aria-current={Boolean(bedrooms)}
              onChange={(event) =>
                update(
                  event.target.value
                    ? { dormitorios: Number.parseInt(event.target.value, 10), dormitoriosOuMais: true }
                    : { dormitorios: undefined, dormitoriosOuMais: undefined },
                )
              }
              className={pill}
              style={chevron}
            >
              <option value="">Quartos</option>
              {options.bedrooms.map((minimum) => (
                <option key={minimum} value={`${minimum}+`}>
                  {bedroomsLabel(minimum)}
                </option>
              ))}
            </select>
          )}
        </Control>
        <Control label="Valor máximo">
          {(id) => (
            <select
              id={id}
              name="valorMax"
              value={filters.valorMax?.toString() ?? ''}
              aria-current={filters.valorMax !== undefined}
              onChange={(event) => update({ valorMax: event.target.value ? Number(event.target.value) : undefined })}
              className={pill}
              style={chevron}
            >
              <option value="">Qualquer valor</option>
              {options.priceCeilings.map((ceiling) => (
                <option key={ceiling} value={ceiling}>
                  Até {formatPriceShort(ceiling)}
                </option>
              ))}
            </select>
          )}
        </Control>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          <Control label="Ordenar por">
            {(id) => (
              <select
                id={id}
                name="ordem"
                value={sort}
                onChange={(event) => go(filters, event.target.value as SortOrder)}
                className={pill}
                style={chevron}
              >
                {SORT_ORDERS.map((order) => (
                  <option key={order.value} value={order.value}>
                    {order.label}
                  </option>
                ))}
              </select>
            )}
          </Control>
          <noscript>
            <button type="submit" className="rounded-full bg-navy px-4 py-2 font-semibold text-white">
              Buscar
            </button>
          </noscript>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? 'Atualizando resultados…' : ''}
      </p>
    </form>
  );
}
