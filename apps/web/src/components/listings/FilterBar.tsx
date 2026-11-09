'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useId, useTransition } from 'react';
import { Select, type SelectGroup } from '@/components/ui/Select';
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
import { listingsHref } from '@/lib/listings-url';

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
  'inline-flex max-w-72 items-center gap-2.5 rounded-full border border-navy/25 bg-white py-2 pr-4 pl-4 font-medium whitespace-nowrap transition-colors duration-150 hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-mist';

/** Every change navigates to the new search URL; the server renders the results. */
export function FilterBar({ options, filters, sort }: { options: SearchOptions; filters: PropertyFilters; sort: SortOrder }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (next: PropertyFilters, nextSort: SortOrder = sort) =>
    startTransition(() => router.push(listingsHref(next, nextSort), { scroll: false }));
  // Changing any filter drops a code search, which would otherwise hide every other result.
  const update = (patch: Partial<PropertyFilters>) => go({ ...filters, codigo: undefined, ...patch });
  const bedrooms = filters.dormitorios === undefined ? '' : `${filters.dormitorios}${filters.dormitoriosOuMais ? '+' : ''}`;

  const locations: SelectGroup[] = [
    { options: [{ value: '', label: 'Toda a Grande Vitória' }] },
    ...options.cities.map((city) => ({
      name: city.name,
      options: [
        { value: `c|${city.name}`, label: city.name, parent: true },
        ...city.neighborhoods.map((neighborhood) => ({ value: `b|${city.name}|${neighborhood}`, label: neighborhood, nested: true })),
      ],
    })),
  ];
  const types: SelectGroup[] = [{ options: [{ value: '', label: 'Todos os tipos' }, ...options.types.map((type) => ({ value: type, label: type }))] }];
  const bedroomChoices: SelectGroup[] = [{ options: [{ value: '', label: 'Quartos' }, ...options.bedrooms.map((minimum) => ({ value: `${minimum}+`, label: bedroomsLabel(minimum) }))] }];
  const prices: SelectGroup[] = [{ options: [{ value: '', label: 'Qualquer valor' }, ...options.priceCeilings.map((ceiling) => ({ value: String(ceiling), label: `Até ${formatPriceShort(ceiling)}` }))] }];
  const sorts: SelectGroup[] = [{ options: SORT_ORDERS.map((order) => ({ value: order.value, label: order.label })) }];

  return (
    <div aria-busy={pending}>
      <div className="scrollbar-none relative -mx-4 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-4 py-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <Control label="Cidade ou bairro">
          {(id) => (
            <Select
              id={id}
              groups={locations}
              value={locationValue(filters)}
              aria-current={Boolean(filters.cidade)}
              onChange={(value) => update({ cidade: undefined, bairro: undefined, ...parseLocation(value) })}
              className={pill}
            />
          )}
        </Control>
        <Control label="Tipo de imóvel">
          {(id) => <Select id={id} groups={types} value={filters.tipo ?? ''} aria-current={Boolean(filters.tipo)} onChange={(value) => update({ tipo: value || undefined })} className={pill} />}
        </Control>
        <Control label="Quartos">
          {(id) => (
            <Select
              id={id}
              groups={bedroomChoices}
              value={bedrooms}
              aria-current={Boolean(bedrooms)}
              onChange={(value) => update(value ? { dormitorios: Number.parseInt(value, 10), dormitoriosOuMais: true } : { dormitorios: undefined, dormitoriosOuMais: undefined })}
              className={pill}
            />
          )}
        </Control>
        <Control label="Valor máximo">
          {(id) => (
            <Select
              id={id}
              groups={prices}
              value={filters.valorMax?.toString() ?? ''}
              aria-current={filters.valorMax !== undefined}
              onChange={(value) => update({ valorMax: value ? Number(value) : undefined })}
              className={pill}
            />
          )}
        </Control>
        <div className="ml-auto shrink-0 pl-2">
          <Control label="Ordenar por">{(id) => <Select id={id} groups={sorts} value={sort} onChange={(value) => go(filters, value as SortOrder)} className={pill} />}</Control>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? 'Atualizando resultados…' : ''}
      </p>
    </div>
  );
}
