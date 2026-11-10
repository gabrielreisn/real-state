import { hasActiveFilters, type PropertyFilters } from './filters';
import { LISTINGS_PATH, listingsHref } from './listings-url';

/** Keep the hero's extra filters when a suggestion opens a city, neighborhood or type. */
export function homeSearchHref(query: string, filters: PropertyFilters, suggestedHref?: string) {
  const busca = query.trim() || undefined;
  if (!hasActiveFilters(filters)) return suggestedHref ?? listingsHref({ busca });

  // A direct listing shortcut should not bypass the buyer's bedroom or budget choices.
  if (!suggestedHref || !/^\/imoveis(?:[/?]|$)/.test(suggestedHref)) return listingsHref({ ...filters, busca });

  const [path, search] = suggestedHref.split('?');
  const params = new URLSearchParams(search);
  const extra = new URLSearchParams(listingsHref(filters).split('?')[1]);
  for (const key of new Set(extra.keys())) {
    params.delete(key);
    for (const value of extra.getAll(key)) params.append(key, value);
  }
  return `${path || LISTINGS_PATH}?${params}`;
}
