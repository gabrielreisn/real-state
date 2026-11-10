'use client';

import { useId } from 'react';
import { BedroomSection } from '@/components/listings/FilterSections';
import type { PropertyFilters, SearchOptions } from '@/lib/filters';
import { formatPrice } from '@/lib/format';
import styles from './PriceRange.module.css';

export type HomeFilterOptions = Pick<SearchOptions, 'bedrooms' | 'lowestPrice' | 'highestPrice'>;

export function HomeSearchFilters({ filters, onChange, options }: { filters: PropertyFilters; onChange: (filters: PropertyFilters) => void; options: HomeFilterOptions }) {
  const id = useId();
  // Use the same published bounds as the listings page, without rounding them.
  const floor = options.lowestPrice ?? 0;
  const ceiling = options.highestPrice ?? floor;
  const span = ceiling - floor;
  const minimum = filters.valorMin ?? floor;
  const maximum = filters.valorMax ?? ceiling;

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-6">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">Número de quartos</legend>
        <BedroomSection draft={filters} onChange={onChange} options={{ ...options, types: [], cities: [], priceCeilings: [] }} />
        <p className="mt-1.5 text-xs text-slate">Selecione uma ou mais opções.</p>
      </fieldset>
      <fieldset className="min-w-0" disabled={span <= 0}>
        <legend className="mb-2 text-sm font-semibold">Faixa de valor</legend>
        <div className="flex items-center justify-between gap-4 text-sm tabular-nums">
          <span>{options.lowestPrice === undefined ? 'Sem mínimo' : formatPrice(minimum)}</span>
          <span>{options.highestPrice === undefined ? 'Sem máximo' : formatPrice(maximum)}</span>
        </div>
        <div className="relative mt-2 h-8">
          <div aria-hidden className="absolute inset-x-2.5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line">
            <div className="absolute h-full rounded-full bg-navy" style={{ left: `${span > 0 ? ((minimum - floor) / span) * 100 : 0}%`, right: `${span > 0 ? ((ceiling - maximum) / span) * 100 : 0}%` }} />
          </div>
          <label htmlFor={`${id}-min`} className="sr-only">Valor mínimo</label>
          <input
            id={`${id}-min`}
            type="range"
            min={floor}
            max={ceiling}
            step={1}
            value={minimum}
            aria-valuetext={formatPrice(minimum)}
            onChange={(event) => {
              const value = Math.min(Number(event.target.value), maximum);
              onChange({ ...filters, valorMin: value > floor ? value : undefined });
            }}
            className={styles.range}
          />
          <label htmlFor={`${id}-max`} className="sr-only">Valor máximo</label>
          <input
            id={`${id}-max`}
            type="range"
            min={floor}
            max={ceiling}
            step={1}
            value={maximum}
            aria-valuetext={formatPrice(maximum)}
            onChange={(event) => {
              const value = Math.max(Number(event.target.value), minimum);
              onChange({ ...filters, valorMax: value < ceiling ? value : undefined });
            }}
            className={styles.range}
          />
        </div>
        <p className="mt-1 text-xs text-slate">Arraste os dois pontos para ajustar.</p>
      </fieldset>
    </div>
  );
}
