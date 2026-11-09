import type { PropertySummary } from '@/content/types';
import { formatPriceShort, plural } from './format';
import { createSearcher } from './property-search';

export type PropertyFilters = {
  /** Free text: building, street, neighborhood, code and so on. */
  busca?: string;
  codigo?: string;
  tipo?: string;
  cidade?: string;
  bairro?: string;
  valorMin?: number;
  valorMax?: number;
  dormitorios?: number;
  /** True for "N or more bedrooms", false for exactly N. */
  dormitoriosOuMais?: boolean;
};

export type SortOrder = 'recentes' | 'menor-preco' | 'maior-preco' | 'maior-area';

export const SORT_ORDERS: { value: SortOrder; label: string }[] = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'maior-area', label: 'Maior área' },
];

export const DEFAULT_SORT: SortOrder = 'recentes';

const PRICE_CEILINGS = [500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
const BEDROOM_MINIMUMS = [1, 2, 3, 4];

/** The fields searching and sorting read. */
export type Searchable = Pick<PropertySummary, 'code' | 'type' | 'city' | 'neighborhood' | 'price' | 'bedrooms' | 'area'> &
  Partial<Pick<PropertySummary, 'condominium' | 'address' | 'excerpt'>>;

type RawParams = Record<string, string | string[] | undefined>;

const text = (value: string | string[] | undefined) => {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
};

const positiveNumber = (value: string | string[] | undefined) => {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

/** The location dropdown packs city and neighborhood into one value: "c|City" or "b|City|Neighborhood". */
export const locationValue = ({ cidade, bairro }: PropertyFilters) =>
  cidade && bairro ? `b|${cidade}|${bairro}` : cidade ? `c|${cidade}` : '';

export function parseLocation(value: string | undefined): Pick<PropertyFilters, 'cidade' | 'bairro'> {
  const [kind, city, neighborhood] = (value ?? '').split('|');
  if (kind === 'c' && city) return { cidade: city };
  if (kind === 'b' && city && neighborhood) return { cidade: city, bairro: neighborhood };
  return {};
}

export function parseFilters(params: RawParams): PropertyFilters {
  const bedrooms = text(params.dormitorios)?.match(/^(\d)(\+)?$/);
  const location = text(params.cidade) ? { cidade: text(params.cidade), bairro: text(params.bairro) } : parseLocation(text(params.local));
  return {
    busca: text(params.busca),
    codigo: text(params.codigo)?.replace(/^#/, ''),
    tipo: text(params.tipo),
    cidade: location.cidade,
    bairro: location.bairro ?? (location.cidade ? undefined : text(params.bairro)),
    valorMin: positiveNumber(params.valorMin),
    valorMax: positiveNumber(params.valorMax),
    dormitorios: bedrooms ? Number(bedrooms[1]) : undefined,
    dormitoriosOuMais: bedrooms ? bedrooms[2] === '+' : undefined,
  };
}

export const parseSort = (params: RawParams): SortOrder => {
  const value = text(params.ordem);
  return SORT_ORDERS.some((order) => order.value === value) ? (value as SortOrder) : DEFAULT_SORT;
};

export const hasActiveFilters = (filters: PropertyFilters) => Object.values(filters).some((value) => value !== undefined);

/** The query string for a search, so every result list has a shareable URL. */
export function filtersToSearch(filters: PropertyFilters, sort: SortOrder) {
  const params = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ['tipo', filters.tipo],
    ['cidade', filters.cidade],
    ['bairro', filters.bairro],
    ['dormitorios', filters.dormitorios === undefined ? undefined : `${filters.dormitorios}${filters.dormitoriosOuMais ? '+' : ''}`],
    ['valorMin', filters.valorMin],
    ['valorMax', filters.valorMax],
    ['busca', filters.busca],
    ['codigo', filters.codigo],
    ['ordem', sort === DEFAULT_SORT ? undefined : sort],
  ];
  for (const [key, value] of entries) if (value !== undefined) params.set(key, String(value));
  return params.toString();
}

export function filterProperties<T extends Searchable>(properties: T[], filters: PropertyFilters) {
  const found = filters.busca ? new Set(createSearcher(properties)(filters.busca)) : null;
  return properties.filter((property) => {
    if (found && !found.has(property)) return false;
    if (filters.codigo && property.code !== filters.codigo) return false;
    if (filters.tipo && property.type !== filters.tipo) return false;
    if (filters.cidade && property.city !== filters.cidade) return false;
    if (filters.bairro && property.neighborhood !== filters.bairro) return false;

    // Listings without a published price cannot match a price range.
    if (filters.valorMin !== undefined && (property.price === null || property.price < filters.valorMin)) return false;
    if (filters.valorMax !== undefined && (property.price === null || property.price > filters.valorMax)) return false;

    if (filters.dormitorios !== undefined) {
      if (property.bedrooms === undefined) return false;
      const matches = filters.dormitoriosOuMais
        ? property.bedrooms >= filters.dormitorios
        : property.bedrooms === filters.dormitorios;
      if (!matches) return false;
    }
    return true;
  });
}

// Listings without a price or area always sort last.
const ascending = (a: number | null | undefined, b: number | null | undefined) =>
  (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY);
const descending = (a: number | null | undefined, b: number | null | undefined) =>
  (b ?? Number.NEGATIVE_INFINITY) - (a ?? Number.NEGATIVE_INFINITY);

export function sortProperties<T extends Searchable>(properties: T[], sort: SortOrder) {
  switch (sort) {
    case 'menor-preco':
      return properties.toSorted((a, b) => ascending(a.price, b.price));
    case 'maior-preco':
      return properties.toSorted((a, b) => descending(a.price, b.price));
    case 'maior-area':
      return properties.toSorted((a, b) => descending(a.area, b.area));
    default:
      // Codes are sequential, so a higher code is a newer listing.
      return properties.toSorted((a, b) => Number(b.code) - Number(a.code));
  }
}

export type SearchOptions = {
  types: string[];
  cities: { name: string; neighborhoods: string[] }[];
  bedrooms: number[];
  priceCeilings: number[];
};

/** Only offers choices that match at least one listing, so no option leads to an empty page. */
export function searchOptions(properties: Searchable[]): SearchOptions {
  const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
  const types = new Set<string>();
  const cities = new Map<string, Set<string>>();
  let mostBedrooms = 0;
  let lowestPrice = Number.POSITIVE_INFINITY;

  for (const property of properties) {
    types.add(property.type);
    const neighborhoods = cities.get(property.city) ?? new Set<string>();
    neighborhoods.add(property.neighborhood);
    cities.set(property.city, neighborhoods);
    mostBedrooms = Math.max(mostBedrooms, property.bedrooms ?? 0);
    if (property.price !== null) lowestPrice = Math.min(lowestPrice, property.price);
  }

  return {
    types: [...types].sort(byName),
    cities: [...cities]
      .map(([name, neighborhoods]) => ({ name, neighborhoods: [...neighborhoods].sort(byName) }))
      .sort((a, b) => byName(a.name, b.name)),
    bedrooms: BEDROOM_MINIMUMS.filter((minimum) => minimum <= mostBedrooms),
    priceCeilings: PRICE_CEILINGS.filter((ceiling) => ceiling >= lowestPrice),
  };
}

export const bedroomsLabel = (minimum: number) => `${minimum} ou mais ${plural(minimum, 'quarto', 'quartos')}`;

export type FilterChipKey = 'busca' | 'codigo' | 'tipo' | 'local' | 'dormitorios' | 'valorMin' | 'valorMax';
export type FilterChip = { key: FilterChipKey; label: string };

export function filterChips(filters: PropertyFilters): FilterChip[] {
  const chips: (FilterChip | false)[] = [
    !!filters.busca && { key: 'busca', label: `“${filters.busca}”` },
    !!filters.codigo && { key: 'codigo', label: `Código ${filters.codigo}` },
    !!filters.tipo && { key: 'tipo', label: filters.tipo },
    !!(filters.bairro || filters.cidade) && {
      key: 'local',
      label: [filters.bairro, filters.cidade].filter(Boolean).join(', '),
    },
    filters.dormitorios !== undefined && {
      key: 'dormitorios',
      label: filters.dormitoriosOuMais
        ? bedroomsLabel(filters.dormitorios)
        : `${filters.dormitorios} ${plural(filters.dormitorios, 'quarto', 'quartos')}`,
    },
    filters.valorMin !== undefined && { key: 'valorMin', label: `A partir de ${formatPriceShort(filters.valorMin)}` },
    filters.valorMax !== undefined && { key: 'valorMax', label: `Até ${formatPriceShort(filters.valorMax)}` },
  ];
  return chips.filter((chip) => chip !== false);
}

export function removeFilter(filters: PropertyFilters, key: FilterChipKey): PropertyFilters {
  if (key === 'local') return { ...filters, cidade: undefined, bairro: undefined };
  if (key === 'dormitorios') return { ...filters, dormitorios: undefined, dormitoriosOuMais: undefined };
  return { ...filters, [key]: undefined };
}
