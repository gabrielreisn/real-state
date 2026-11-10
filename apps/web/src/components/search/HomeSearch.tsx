'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaArrowRight, FaBuilding, FaChevronDown, FaCity, FaHashtag, FaHouse, FaLocationDot, FaMagnifyingGlass, FaRoad, FaSliders, FaTag, FaXmark } from 'react-icons/fa6';
import { filterChips, type PropertyFilters } from '@/lib/filters';
import { homeSearchHref } from '@/lib/home-search';
import { LISTINGS_PATH, listingsHref } from '@/lib/listings-url';
import { highlightParts } from '@/lib/property-search';
import { createSuggester, listingForCode, type Suggestion, type SuggestionListing } from '@/lib/search-suggestions';
import { HomeSearchFilters, type HomeFilterOptions } from './HomeSearchFilters';
import styles from './HomeSearch.module.css';

const MIN_LENGTH = 2;

const ALL_RESULTS = 'Busca';
const KIND_ICONS: Record<string, IconType> = {
  Código: FaHashtag,
  Condomínio: FaBuilding,
  Endereço: FaRoad,
  Bairro: FaLocationDot,
  Cidade: FaCity,
  Tipo: FaTag,
  Imóvel: FaHouse,
  [ALL_RESULTS]: FaMagnifyingGlass,
};

/**
 * One field that finds a listing by building, street, neighborhood, city, type or code. Without
 * JavaScript it is a plain GET form to the listings page, which runs the same search.
 */
export function HomeSearch({ listings, filterOptions }: { listings: SuggestionListing[]; filterOptions: HomeFilterOptions }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-sugestoes`;
  const listRef = useRef<HTMLUListElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggest = useMemo(() => createSuggester(listings), [listings]);
  const typed = query.trim();
  const searching = typed.length >= MIN_LENGTH;
  const suggestions = useMemo(() => {
    if (!searching) return [];
    const found = suggest(typed);
    if (found.length === 0) return found;
    const all: Suggestion = { kind: ALL_RESULTS, label: `Ver todos os resultados para “${typed}”`, detail: '', href: listingsHref({ busca: typed }) };
    return [...found, all];
  }, [searching, suggest, typed]);
  const showPanel = open && searching;
  const optionId = (index: number) => `${id}-opcao-${index}`;
  const chips = filterChips(filters);
  const activeCount = chips.length;
  const summary = chips.map((chip) => chip.label).join(' · ');

  useEffect(() => {
    if (!filtersOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [filtersOpen]);

  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function go(href: string) {
    setFiltersOpen(false);
    setOpen(false);
    setActive(-1);
    router.push(homeSearchHref(typed, filters, href));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (showPanel && active >= 0) return go(suggestions[active].href);
    if (!typed) return go(listingsHref({}));
    go(listingForCode(listings, typed)?.href ?? listingsHref({ busca: typed }));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (suggestions.length === 0) return;
    event.preventDefault();
    setOpen(true);
    const count = suggestions.length;
    setActive((current) => (event.key === 'ArrowDown' ? (current + 1) % count : current <= 0 ? count - 1 : current - 1));
  }

  return (
    <form
      ref={formRef}
      action={LISTINGS_PATH}
      method="get"
      role="search"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && filtersOpen) {
          setFiltersOpen(false);
          filtersButtonRef.current?.focus();
        }
      }}
      className="relative max-w-3xl"
    >
      <div className="relative">
        <div className="flex rounded-[15px] bg-white p-[3px] text-ink shadow-xl outline-offset-2 outline-brand has-[input:focus-visible]:outline-2">
          <div className="relative min-w-0 flex-1">
            <FaMagnifyingGlass aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate" />
            <label htmlFor={id} className="sr-only">
              Buscar imóveis por condomínio, rua, bairro ou código
            </label>
            <input
              id={id}
              name="busca"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showPanel && suggestions.length > 0}
              aria-controls={listId}
              aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Prédio, rua, bairro ou código"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(-1);
                setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
                setFiltersOpen(false);
              }}
              onBlur={() => {
                setOpen(false);
                setActive(-1);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent py-3.5 pr-3 pl-11 text-lg placeholder:text-slate focus-visible:outline-none md:py-4 md:pl-13 md:text-xl"
            />
          </div>
          <button type="submit" className="shrink-0 rounded-[4px_12px_12px_4px] bg-brand px-5 text-lg font-semibold text-white hover:bg-brand-dark focus-visible:-outline-offset-4 md:px-9">
            Buscar
          </button>
        </div>

        <div className={showPanel ? 'absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[15px] bg-white text-ink shadow-2xl ring-1 ring-navy/10' : 'hidden'}>
          <ul ref={listRef} id={listId} role="listbox" aria-label="Sugestões" className="max-h-[min(30rem,60vh)] overflow-y-auto overscroll-contain p-1.5">
            {suggestions.map((suggestion, index) => {
              const Icon = KIND_ICONS[suggestion.kind] ?? FaHouse;
              const isAll = suggestion.kind === ALL_RESULTS;
              return (
                <li
                  key={`${suggestion.kind}-${suggestion.href}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  // Keeps focus in the field, so the blur doesn't close the list before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(suggestion.href)}
                  onMouseEnter={() => setActive(index)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 aria-selected:bg-mist"
                >
                  <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm ${isAll ? 'bg-brand/10 text-brand' : 'bg-mist text-navy'}`}>
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    {isAll ? (
                      <span className="block truncate font-semibold text-brand">{suggestion.label}</span>
                    ) : (
                      <>
                        <span className="block truncate text-slate">
                          {highlightParts(suggestion.label, typed).map((part, partIndex) => (
                            <span key={partIndex} className={part.match ? 'font-bold text-ink' : 'font-medium text-ink/80'}>
                              {part.text}
                            </span>
                          ))}
                        </span>
                        <span className="block truncate text-sm text-slate">{suggestion.detail}</span>
                      </>
                    )}
                  </span>
                  {isAll ? (
                    <FaArrowRight aria-hidden className="shrink-0 text-sm text-brand" />
                  ) : (
                    <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs font-medium text-slate">{suggestion.kind}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {suggestions.length === 0 ? (
            <p className="p-4 text-slate">Nada encontrado para “{typed}”. Tente o bairro, a rua ou o código do anúncio.</p>
          ) : null}
        </div>

      </div>
      {(filters.quartos ?? []).map((count) => <input key={count} type="hidden" name="dormitorios" value={count === 4 ? '4+' : count} />)}
      <input type="hidden" name="valorMin" value={filters.valorMin ?? ''} disabled={filters.valorMin === undefined} />
      <input type="hidden" name="valorMax" value={filters.valorMax ?? ''} disabled={filters.valorMax === undefined} />

      <div className="mt-3 flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1">
        <button
          ref={filtersButtonRef}
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={`${id}-filtros`}
          onClick={() => {
            setOpen(false);
            setActive(-1);
            setFiltersOpen(!filtersOpen);
          }}
          className="inline-grid h-10 w-44 shrink-0 grid-cols-[auto_1fr_1rem_auto] items-center gap-2 rounded-full bg-navy/15 px-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <FaSliders aria-hidden className="text-xs" />
          <span className="text-left whitespace-nowrap">{filtersOpen ? 'Menos filtros' : 'Mais filtros'}</span>
          <span aria-hidden={activeCount === 0} className={`flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-navy ${activeCount === 0 ? 'invisible' : ''}`}>{activeCount}</span>
          <FaChevronDown aria-hidden className={`text-[10px] transition-transform duration-200 motion-reduce:transition-none ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
        <span aria-live="polite" className="text-sm text-white/90">{summary}</span>
      </div>

      <div
        id={`${id}-filtros`}
        role="region"
        aria-labelledby={`${id}-filtros-titulo`}
        aria-hidden={!filtersOpen}
        inert={!filtersOpen}
        data-open={filtersOpen}
        className={`${styles.filtersPanel} absolute inset-x-0 top-full z-10 mt-2 rounded-xl bg-white p-4 text-ink shadow-2xl ring-1 ring-navy/10 [--focus:var(--color-brand)] sm:px-5`}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id={`${id}-filtros-titulo`} className="text-xs font-semibold tracking-wider text-slate uppercase">Refine sua busca</h2>
          <button type="button" aria-label="Fechar filtros" onClick={() => { setFiltersOpen(false); filtersButtonRef.current?.focus(); }} className="-m-2 flex size-10 items-center justify-center rounded-full text-slate hover:bg-mist">
            <FaXmark aria-hidden />
          </button>
        </div>
        <HomeSearchFilters filters={filters} onChange={setFilters} options={filterOptions} />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <button type="button" disabled={activeCount === 0} onClick={() => setFilters({})} className="py-2 text-sm font-medium text-slate underline underline-offset-4 hover:text-ink disabled:opacity-40">Limpar filtros</button>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Buscar imóveis</button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {showPanel ? `${suggestions.length} ${suggestions.length === 1 ? 'sugestão' : 'sugestões'}` : ''}
      </p>
    </form>
  );
}
