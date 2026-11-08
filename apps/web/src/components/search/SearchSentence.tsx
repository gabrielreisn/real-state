'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useId, useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import type { PropertySummary } from '@/content/types';
import { bedroomsLabel, filterProperties, locationValue, parseLocation, type PropertyFilters, searchOptions } from '@/lib/filters';
import { formatPriceShort, plural } from '@/lib/format';
import { LISTINGS_PATH, listingsHref } from '@/lib/listings-url';

function Choice({
  label,
  name,
  value,
  onChange,
  children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <span className="relative inline-block max-w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} className="choice">
        {children}
      </select>
      <FaChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-[0.45em] text-gold" />
    </span>
  );
}

/**
 * The search reads the way a buyer would describe what they want to a broker. The button
 * shows the live count and opens the listings page with those filters. Without JavaScript
 * it is a plain GET form to the same page.
 */
export function SearchSentence({ properties }: { properties: PropertySummary[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<PropertyFilters>({});
  const options = useMemo(() => searchOptions(properties), [properties]);
  const results = useMemo(() => filterProperties(properties, filters), [properties, filters]);
  const actions = {
    update: (patch: Partial<PropertyFilters>) => setFilters((current) => ({ ...current, ...patch })),
    clear: () => setFilters({}),
  };

  const bedrooms = filters.dormitorios === undefined ? '' : `${filters.dormitorios}${filters.dormitoriosOuMais ? '+' : ''}`;
  const filtered = Object.values(filters).some((value) => value !== undefined);
  const count = results.length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(listingsHref(filters));
  }

  return (
    <form action={LISTINGS_PATH} method="get" onSubmit={handleSubmit}>
      <p className="max-w-5xl text-[1.75rem] leading-[1.45] font-semibold tracking-tight text-pretty sm:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.4]">
        Procuro{' '}
        <Choice label="Tipo de imóvel" name="tipo" value={filters.tipo ?? ''} onChange={(tipo) => actions.update({ tipo: tipo || undefined })}>
          <option value="">qualquer imóvel</option>
          {options.types.map((type) => (
            <option key={type} value={type}>
              {type.toLowerCase()}
            </option>
          ))}
        </Choice>{' '}
        em{' '}
        <Choice
          label="Cidade ou bairro"
          name="local"
          value={locationValue(filters)}
          onChange={(value) => actions.update({ cidade: undefined, bairro: undefined, ...parseLocation(value) })}
        >
          <option value="">toda a Grande Vitória</option>
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
        </Choice>{' '}
        com{' '}
        <Choice
          label="Número de quartos"
          name="dormitorios"
          value={bedrooms}
          onChange={(value) =>
            actions.update(value ? { dormitorios: Number.parseInt(value, 10), dormitoriosOuMais: true } : { dormitorios: undefined, dormitoriosOuMais: undefined })
          }
        >
          <option value="">qualquer número de quartos</option>
          {options.bedrooms.map((minimum) => (
            <option key={minimum} value={`${minimum}+`}>
              {bedroomsLabel(minimum)}
            </option>
          ))}
        </Choice>{' '}
        por{' '}
        <Choice
          label="Valor máximo"
          name="valorMax"
          value={filters.valorMax?.toString() ?? ''}
          onChange={(value) => actions.update({ valorMax: value ? Number(value) : undefined })}
        >
          <option value="">qualquer valor</option>
          {options.priceCeilings.map((ceiling) => (
            <option key={ceiling} value={ceiling}>
              até {formatPriceShort(ceiling)}
            </option>
          ))}
        </Choice>
        .
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" className="bg-brand px-7 py-3.5 text-lg font-semibold text-white hover:bg-brand-dark">
          {count === 0 ? 'Ver sugestões' : `Ver ${count} ${plural(count, 'imóvel', 'imóveis')}`}
        </button>
        <p aria-live="polite" className="text-on-navy">
          {count === 0 ? 'Nenhum imóvel com essa combinação. Tente outro bairro ou valor.' : null}
        </p>
        {filtered ? (
          <button type="button" onClick={actions.clear} className="text-on-navy underline underline-offset-4 hover:text-white">
            Limpar busca
          </button>
        ) : null}
      </div>
    </form>
  );
}
