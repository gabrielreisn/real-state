'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaArrowRight, FaBuilding, FaCity, FaHashtag, FaHouse, FaLocationDot, FaMagnifyingGlass, FaRoad, FaTag } from 'react-icons/fa6';
import { LISTINGS_PATH, listingsHref } from '@/lib/listings-url';
import { highlightParts } from '@/lib/property-search';
import { createSuggester, listingForCode, type Suggestion, type SuggestionListing } from '@/lib/search-suggestions';

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
export function HomeSearch({ listings }: { listings: SuggestionListing[] }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-sugestoes`;
  const listRef = useRef<HTMLUListElement>(null);
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

  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    router.push(href);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (showPanel && active >= 0) return go(suggestions[active].href);
    if (!typed) return go(LISTINGS_PATH);
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
    <form action={LISTINGS_PATH} method="get" role="search" onSubmit={handleSubmit} className="relative max-w-3xl">
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
            onFocus={() => setOpen(true)}
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

      <p aria-live="polite" className="sr-only">
        {showPanel ? `${suggestions.length} ${suggestions.length === 1 ? 'sugestão' : 'sugestões'}` : ''}
      </p>
    </form>
  );
}
