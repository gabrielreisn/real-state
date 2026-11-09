'use client';

import clsx from 'clsx';
import { useId, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { type PropertyFilters, type SearchOptions, selectedLocations, selectedTypes, toggleLocation, withLocations, withTypes } from '@/lib/filters';
import { formatPriceShort } from '@/lib/format';
import { normalize } from '@/lib/property-search';

export type SectionProps = { draft: PropertyFilters; onChange: (next: PropertyFilters) => void; options: SearchOptions };

function Check({ checked, onChange, children, className, implied }: { checked: boolean; onChange: () => void; children: React.ReactNode; className?: string; /** Already covered by a broader choice, like a neighborhood under a chosen city. */ implied?: boolean }) {
  return (
    <label className={clsx('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-mist', implied ? 'opacity-45' : 'has-[:checked]:font-semibold', className)}>
      <input type="checkbox" checked={checked} onChange={onChange} className="size-[1.125rem] shrink-0 accent-brand" />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

export function LocationSection({ draft, onChange, options }: SectionProps) {
  const [search, setSearch] = useState('');
  const places = selectedLocations(draft);
  const wanted = normalize(search);
  const has = (text: string) => normalize(text).includes(wanted);
  const toggle = (value: string) => onChange(withLocations(draft, toggleLocation(places, value)));
  const cities = options.cities
    .map((city) => ({ ...city, neighborhoods: !wanted || has(city.name) ? city.neighborhoods : city.neighborhoods.filter(has) }))
    .filter((city) => !wanted || has(city.name) || city.neighborhoods.length > 0);

  return (
    <div>
      {/* Stays on top while the list scrolls. */}
      <div className="sticky top-0 z-10 bg-white pt-3 pb-2">
        <div className="relative">
          <FaMagnifyingGlass aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate" />
          <input
            type="search"
            aria-label="Buscar cidade ou bairro"
            placeholder="Buscar cidade ou bairro"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-line bg-white py-2 pr-3 pl-9 placeholder:text-slate"
          />
        </div>
      </div>
      <div>
        {cities.map((city, index) => (
          <div key={city.name} role="group" aria-label={city.name} className={clsx(index > 0 && 'mt-1 border-t border-line pt-1')}>
            <Check checked={places.includes(`c|${city.name}`)} onChange={() => toggle(`c|${city.name}`)} className="font-bold">
              {city.name}
            </Check>
            {city.neighborhoods.map((neighborhood) => {
              const value = `b|${city.name}|${neighborhood}`;
              const wholeCity = places.includes(`c|${city.name}`);
              return (
                <Check key={value} checked={wholeCity || places.includes(value)} implied={wholeCity} onChange={() => toggle(value)} className="pl-7">
                  {neighborhood}
                </Check>
              );
            })}
          </div>
        ))}
        {cities.length === 0 ? <p className="p-2.5 text-slate">Nenhum local com esse nome.</p> : null}
      </div>
    </div>
  );
}

export function TypeSection({ draft, onChange, options }: SectionProps) {
  const types = selectedTypes(draft);
  const toggle = (type: string) => onChange(withTypes(draft, types.includes(type) ? types.filter((item) => item !== type) : [...types, type]));
  return (
    <div className="pt-2">
      {options.types.map((type) => (
        <Check key={type} checked={types.includes(type)} onChange={() => toggle(type)}>
          {type}
        </Check>
      ))}
    </div>
  );
}

const choice = 'rounded-lg border px-4 py-2 font-medium transition-colors duration-150';
const choiceState = (on: boolean) => (on ? 'border-navy bg-navy text-white' : 'border-line bg-white hover:border-navy');

export function BedroomSection({ draft, onChange, options }: SectionProps) {
  const selected = draft.quartos ?? [];
  const toggle = (count: number) => {
    const next = selected.includes(count) ? selected.filter((item) => item !== count) : [...selected, count].sort((a, b) => a - b);
    onChange({ ...draft, quartos: next.length > 0 ? next : undefined });
  };
  return (
    <div role="group" aria-label="Número de quartos" className="flex flex-wrap gap-2">
      {options.bedrooms.map((count) => (
        <button key={count} type="button" aria-pressed={selected.includes(count)} onClick={() => toggle(count)} className={clsx(choice, 'min-w-14', choiceState(selected.includes(count)))}>
          {count === 4 ? '4+' : count}
        </button>
      ))}
    </div>
  );
}

function MoneyField({ label, value, hint, onChange }: { label: string; value: number | undefined; hint: number | undefined; onChange: (value: number | undefined) => void }) {
  const id = useId();
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 outline-offset-2 outline-brand has-[input:focus-visible]:border-navy has-[input:focus-visible]:outline-2">
        <span aria-hidden className="text-sm text-slate">
          R$
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={hint?.toLocaleString('pt-BR') ?? 'Qualquer'}
          value={value?.toLocaleString('pt-BR') ?? ''}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '');
            onChange(digits ? Number(digits) : undefined);
          }}
          className="w-full min-w-0 bg-transparent py-2.5 placeholder:text-slate focus-visible:outline-none"
        />
      </div>
    </div>
  );
}

export function PriceSection({ draft, onChange, options }: SectionProps) {
  const inverted = draft.valorMin !== undefined && draft.valorMax !== undefined && draft.valorMin > draft.valorMax;
  return (
    <div>
      <div className="flex gap-3">
        <MoneyField label="Mínimo" value={draft.valorMin} hint={options.lowestPrice} onChange={(valorMin) => onChange({ ...draft, valorMin })} />
        <MoneyField label="Máximo" value={draft.valorMax} hint={options.highestPrice} onChange={(valorMax) => onChange({ ...draft, valorMax })} />
      </div>
      {inverted ? <p className="mt-2 text-sm font-medium text-brand">O valor mínimo está maior que o máximo.</p> : null}
      <div role="group" aria-label="Valores máximos sugeridos" className="mt-3 flex flex-wrap gap-2">
        {options.priceCeilings.map((ceiling) => (
          <button
            key={ceiling}
            type="button"
            aria-pressed={draft.valorMax === ceiling}
            onClick={() => onChange({ ...draft, valorMax: draft.valorMax === ceiling ? undefined : ceiling })}
            className={clsx('rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-150', choiceState(draft.valorMax === ceiling))}
          >
            Até {formatPriceShort(ceiling).replace('R$ ', '')}
          </button>
        ))}
      </div>
    </div>
  );
}
