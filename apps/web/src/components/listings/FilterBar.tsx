'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef, useState, useTransition } from 'react';
import { FaSliders, FaXmark } from 'react-icons/fa6';
import { Select, type SelectGroup } from '@/components/ui/Select';
import {
  bedroomsSummary,
  filterProperties,
  parseLocation,
  type PropertyFilters,
  type SearchOptions,
  type Searchable,
  selectedLocations,
  selectedTypes,
  SORT_ORDERS,
  type SortOrder,
  withLocations,
  withTypes,
} from '@/lib/filters';
import { formatPriceShort, plural } from '@/lib/format';
import { listingsHref } from '@/lib/listings-url';
import { FilterPopover } from './FilterPopover';
import { BedroomSection, LocationSection, PriceSection, type SectionProps, TypeSection } from './FilterSections';

const pill =
  'inline-flex max-w-72 items-center gap-2.5 rounded-full border border-navy/25 bg-white py-2 pr-4 pl-4 font-medium whitespace-nowrap transition-colors duration-150 hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-mist';

const severalOr = (names: string[], fallback: string, unit: string) => (names.length === 0 ? fallback : names.length === 1 ? names[0] : `${names.length} ${unit}`);

function priceSummary({ valorMin, valorMax }: PropertyFilters) {
  if (valorMin !== undefined && valorMax !== undefined) return `${formatPriceShort(valorMin)} a ${formatPriceShort(valorMax).replace('R$ ', '')}`;
  if (valorMax !== undefined) return `Até ${formatPriceShort(valorMax)}`;
  if (valorMin !== undefined) return `A partir de ${formatPriceShort(valorMin)}`;
  return 'Qualquer valor';
}

function FilterSheet({ section, applyLabel, activeCount, onApply, onCancel, onClear }: { section: SectionProps; applyLabel: string; activeCount: number; onApply: () => void; onCancel: () => void; onClear: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const apply = () => {
    dialog.current?.close('aplicar');
    onApply();
  };
  // The shortest first, so the long lists don't push everything else out of reach.
  const blocks = [
    { title: 'Quartos', content: <BedroomSection {...section} /> },
    { title: 'Valor', content: <PriceSection {...section} /> },
    { title: 'Tipo de imóvel', content: <TypeSection {...section} /> },
    { title: 'Cidade ou bairro', content: <LocationSection {...section} /> },
  ];

  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-current={activeCount > 0} onClick={() => dialog.current?.showModal()} className={pill}>
        <FaSliders aria-hidden className="text-sm" />
        Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => {
          if (dialog.current?.returnValue !== 'aplicar') onCancel();
          if (dialog.current) dialog.current.returnValue = '';
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-white text-ink [--focus:var(--color-brand)]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id={titleId} className="text-xl font-bold">
              Filtros
            </h2>
            <button type="button" aria-label="Fechar filtros" onClick={() => dialog.current?.close()} className="flex size-11 items-center justify-center rounded-full text-xl hover:bg-mist">
              <FaXmark aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
            {blocks.map((block) => (
              <section key={block.title} className="border-b border-line py-5 last:border-b-0">
                <h3 className="mb-3 font-bold">{block.title}</h3>
                {block.content}
              </section>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line p-4">
            <button type="button" onClick={onClear} className="font-semibold underline underline-offset-4">
              Limpar tudo
            </button>
            <button type="button" onClick={apply} className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">
              {applyLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Choices are drafted against a live count and become a new search URL when applied; the server renders the results. */
export function FilterBar({ options, filters, sort, listings }: { options: SearchOptions; filters: PropertyFilters; sort: SortOrder; listings: Searchable[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(filters);

  // A new search (from a chip, the back button or an applied filter) resets the draft.
  const applied = listingsHref(filters);
  const [draftedFrom, setDraftedFrom] = useState(applied);
  if (draftedFrom !== applied) {
    setDraftedFrom(applied);
    setDraft(filters);
  }

  const go = (next: PropertyFilters, nextSort: SortOrder) => startTransition(() => router.push(listingsHref(next, nextSort), { scroll: false }));
  // Changing any filter drops a code search, which would otherwise hide every other result.
  const apply = () => {
    if (listingsHref(draft) !== applied) go({ ...draft, codigo: undefined }, sort);
  };
  const cancel = () => setDraft(filters);

  const count = filterProperties(listings, { ...draft, busca: undefined, codigo: undefined }).length;
  const applyLabel = count === 0 ? 'Nenhum imóvel' : `Ver ${count} ${plural(count, 'imóvel', 'imóveis')}`;

  const places = selectedLocations(filters).map((place) => parseLocation(place).bairro ?? parseLocation(place).cidade ?? '');
  const types = selectedTypes(filters);
  const section: SectionProps = { draft, onChange: setDraft, options };
  const shared = { applyLabel, onApply: apply, onCancel: cancel, className: pill };
  const activeCount = [places.length > 0, types.length > 0, Boolean(filters.quartos), filters.valorMin !== undefined || filters.valorMax !== undefined].filter(Boolean).length;
  const sorts: SelectGroup[] = [{ options: SORT_ORDERS.map((order) => ({ value: order.value, label: order.label })) }];
  const sortId = useId();
  const clearAll = () => setDraft({ busca: filters.busca });

  const sortControl = (
    <div>
      <label htmlFor={sortId} className="sr-only">
        Ordenar por
      </label>
      <Select id={sortId} groups={sorts} value={sort} onChange={(value) => go(filters, value as SortOrder)} className={pill} />
    </div>
  );

  return (
    <div aria-busy={pending}>
      <div className="flex items-center justify-between gap-2 py-3 md:hidden">
        <FilterSheet section={section} applyLabel={applyLabel} activeCount={activeCount} onApply={apply} onCancel={cancel} onClear={clearAll} />
        {sortControl}
      </div>
      <div className="hidden flex-wrap items-center gap-2 py-3 md:flex">
        <FilterPopover {...shared} label="Cidade ou bairro" summary={severalOr(places, 'Toda a Grande Vitória', 'locais')} active={places.length > 0} scrolls onClear={() => setDraft(withLocations(draft, []))}>
          <LocationSection {...section} />
        </FilterPopover>
        <FilterPopover {...shared} label="Tipo de imóvel" summary={severalOr(types, 'Todos os tipos', 'tipos')} active={types.length > 0} scrolls onClear={() => setDraft(withTypes(draft, []))}>
          <TypeSection {...section} />
        </FilterPopover>
        <FilterPopover {...shared} label="Quartos" summary={filters.quartos ? bedroomsSummary(filters.quartos) : 'Quartos'} active={Boolean(filters.quartos)} onClear={() => setDraft({ ...draft, quartos: undefined })}>
          <BedroomSection {...section} />
        </FilterPopover>
        <FilterPopover
          {...shared}
          label="Valor"
          summary={priceSummary(filters)}
          active={filters.valorMin !== undefined || filters.valorMax !== undefined}
          onClear={() => setDraft({ ...draft, valorMin: undefined, valorMax: undefined })}
        >
          <PriceSection {...section} />
        </FilterPopover>
        <div className="ml-auto shrink-0 pl-2">{sortControl}</div>
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? 'Atualizando resultados…' : ''}
      </p>
    </div>
  );
}
