'use client';

import { createContext, type ReactNode, use, useMemo, useState } from 'react';
import type { PropertySummary } from '@/content/types';
import {
  type FilterChipKey,
  filterProperties,
  filtersToSearch,
  type PropertyFilters,
  removeFilter,
  type SearchOptions,
  searchOptions,
  type SortOrder,
  sortProperties,
} from '@/lib/filters';

export const RESULTS_HEADING_ID = 'resultados-titulo';

type SearchContextValue = {
  state: { filters: PropertyFilters; sort: SortOrder };
  actions: {
    /** Merges filters. Any change except a code lookup clears the code, which would otherwise hide every other result. */
    update: (patch: Partial<PropertyFilters>) => void;
    remove: (key: FilterChipKey) => void;
    clear: () => void;
    setSort: (sort: SortOrder) => void;
    showResults: () => void;
  };
  meta: {
    results: PropertySummary[];
    options: SearchOptions;
    findByCode: (code: string) => PropertySummary | undefined;
  };
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const context = use(SearchContext);
  if (!context) throw new Error('useSearch must be used inside <SearchProvider>');
  return context;
}

/**
 * Owns the search state for the landing page. The hero sentence, the result list and the
 * neighborhood links all read and change it, and the URL mirrors it so results can be shared.
 */
export function SearchProvider({
  properties,
  initialFilters,
  initialSort,
  children,
}: {
  properties: PropertySummary[];
  initialFilters: PropertyFilters;
  initialSort: SortOrder;
  children: ReactNode;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSortState] = useState(initialSort);

  const options = useMemo(() => searchOptions(properties), [properties]);
  const results = useMemo(() => sortProperties(filterProperties(properties, filters), sort), [properties, filters, sort]);

  // Updating the URL here, not in an effect, keeps it in step with the action that caused it.
  const commit = (nextFilters: PropertyFilters, nextSort: SortOrder) => {
    setFilters(nextFilters);
    setSortState(nextSort);
    const query = filtersToSearch(nextFilters, nextSort);
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  };

  const value: SearchContextValue = {
    state: { filters, sort },
    actions: {
      update: (patch) => commit({ ...filters, codigo: undefined, ...patch }, sort),
      remove: (key) => commit(removeFilter(filters, key), sort),
      clear: () => commit({}, sort),
      setSort: (nextSort) => commit(filters, nextSort),
      showResults: () => {
        const heading = document.getElementById(RESULTS_HEADING_ID);
        heading?.scrollIntoView({ block: 'start' });
        heading?.focus({ preventScroll: true });
      },
    },
    meta: {
      results,
      options,
      findByCode: (code) => properties.find((property) => property.code === code.trim().replace(/^#/, '')),
    },
  };

  return <SearchContext value={value}>{children}</SearchContext>;
}
