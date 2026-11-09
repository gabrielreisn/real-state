import type { PropertySummary } from '@/content/types';
import { formatPriceShort, plural } from './format';
import { createSearcher } from './property-search';

export type PropertyFilters = {
  /** Free text: building, street, neighborhood, code and so on. */
  busca?: string;
  codigo?: string;
  tipo?: string;
  /** Two or more types; a single one stays in `tipo`. */
  tipos?: string[];
  cidade?: string;
  bairro?: string;
  /** Two or more places, as "c|City" or "b|City|Neighborhood"; a single one stays in `cidade`/`bairro`, which have their own indexable pages. */
  locais?: string[];
  valorMin?: number;
  valorMax?: number;
  /** Bedroom counts to include; 4 stands for "4 or more". */
  quartos?: number[];
};

export type SortOrder = 'recentes' | 'menor-preco' | 'maior-preco' | 'maior-area';

export const SORT_ORDERS: { value: SortOrder; label: string }[] = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'maior-area', label: 'Maior área' },
];

export const DEFAULT_SORT: SortOrder = 'recentes';

// Where buyers look most, not alphabetical. Any other city follows these, in name order.
const CITY_ORDER = ['Vitória', 'Vila Velha', 'Serra', 'Guarapari', 'Fundão', 'Domingos Martins'];
const cityRank = (city: string) => {
  const rank = CITY_ORDER.indexOf(city);
  return rank === -1 ? CITY_ORDER.length : rank;
};

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

const allTexts = (value: string | string[] | undefined) =>
  [...new Set((Array.isArray(value) ? value : [value]).map((item) => item?.trim()).filter((item): item is string => Boolean(item)))];

const MAX_BEDROOMS = 4;

/** "3" is exactly three bedrooms and "3+" three or more, as in links from before multiple choices. */
function parseBedrooms(value: string | string[] | undefined) {
  const counts = new Set<number>();
  for (const item of allTexts(value)) {
    const match = item.match(/^(\d)(\+)?$/);
    if (!match || match[1] === '0') continue;
    const count = Math.min(Number(match[1]), MAX_BEDROOMS);
    counts.add(count);
    if (match[2]) for (let more = count + 1; more <= MAX_BEDROOMS; more++) counts.add(more);
  }
  return counts.size > 0 ? [...counts].sort((a, b) => a - b) : undefined;
}

export function parseFilters(params: RawParams): PropertyFilters {
  const places = allTexts(params.local).filter((value) => parseLocation(value).cidade);
  const types = allTexts(params.tipo);
  const location = text(params.cidade) ? { cidade: text(params.cidade), bairro: text(params.bairro) } : places.length === 1 ? parseLocation(places[0]) : {};
  return {
    busca: text(params.busca),
    codigo: text(params.codigo)?.replace(/^#/, ''),
    tipo: types.length === 1 ? types[0] : undefined,
    tipos: types.length > 1 ? types : undefined,
    cidade: location.cidade,
    bairro: location.bairro ?? (location.cidade || places.length > 1 ? undefined : text(params.bairro)),
    locais: !location.cidade && places.length > 1 ? places : undefined,
    valorMin: positiveNumber(params.valorMin),
    valorMax: positiveNumber(params.valorMax),
    quartos: parseBedrooms(params.dormitorios),
  };
}

/** A run reaching the top ("3, 4") is "3 or more". */
const bedroomsFrom = (counts: number[]) =>
  counts.at(-1) === MAX_BEDROOMS && counts.every((count, index) => count === counts[0] + index) ? counts[0] : undefined;

/** The URL values for a bedroom choice: one "N+" when possible, so older links and new ones agree. */
export function bedroomParams(counts: number[] | undefined) {
  if (!counts?.length) return [];
  const from = bedroomsFrom(counts);
  if (from !== undefined) return [`${from}+`];
  return counts.map(String);
}

export const selectedLocations = (filters: PropertyFilters) => filters.locais ?? (filters.cidade ? [locationValue(filters)] : []);
export const selectedTypes = (filters: PropertyFilters) => filters.tipos ?? (filters.tipo ? [filters.tipo] : []);

export function withLocations(filters: PropertyFilters, places: string[]): PropertyFilters {
  const base = { ...filters, cidade: undefined, bairro: undefined, locais: undefined };
  if (places.length === 0) return base;
  return places.length === 1 ? { ...base, ...parseLocation(places[0]) } : { ...base, locais: places };
}

export const withTypes = (filters: PropertyFilters, types: string[]): PropertyFilters => ({
  ...filters,
  tipo: types.length === 1 ? types[0] : undefined,
  tipos: types.length > 1 ? types : undefined,
});

/** Choosing a whole city replaces its neighborhoods; choosing a neighborhood replaces its whole city. */
export function toggleLocation(places: string[], value: string) {
  if (places.includes(value)) return places.filter((place) => place !== value);
  const { cidade, bairro } = parseLocation(value);
  const kept = places.filter((place) => {
    const other = parseLocation(place);
    if (other.cidade !== cidade) return true;
    return bairro ? Boolean(other.bairro) : false;
  });
  return [...kept, value];
}

/** Whether a search this specific should stay out of search engines. */
export const isCombinedSearch = (filters: PropertyFilters) => Boolean(filters.busca || filters.locais || filters.tipos);

export const parseSort = (params: RawParams): SortOrder => {
  const value = text(params.ordem);
  return SORT_ORDERS.some((order) => order.value === value) ? (value as SortOrder) : DEFAULT_SORT;
};

export const hasActiveFilters = (filters: PropertyFilters) => Object.values(filters).some((value) => value !== undefined);

export function filterProperties<T extends Searchable>(properties: T[], filters: PropertyFilters) {
  const found = filters.busca ? new Set(createSearcher(properties)(filters.busca)) : null;
  const places = filters.locais?.map(parseLocation);
  return properties.filter((property) => {
    if (found && !found.has(property)) return false;
    if (filters.codigo && property.code !== filters.codigo) return false;
    if (filters.tipo && property.type !== filters.tipo) return false;
    if (filters.tipos && !filters.tipos.includes(property.type)) return false;
    if (filters.cidade && property.city !== filters.cidade) return false;
    if (filters.bairro && property.neighborhood !== filters.bairro) return false;
    if (places && !places.some(({ cidade, bairro }) => cidade === property.city && (!bairro || bairro === property.neighborhood))) return false;

    // Listings without a published price cannot match a price range.
    if (filters.valorMin !== undefined && (property.price === null || property.price < filters.valorMin)) return false;
    if (filters.valorMax !== undefined && (property.price === null || property.price > filters.valorMax)) return false;

    if (filters.quartos && (property.bedrooms === undefined || !filters.quartos.includes(Math.min(property.bedrooms, MAX_BEDROOMS)))) return false;
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
  /** The cheapest and dearest published prices, or undefined when no listing has one. */
  lowestPrice?: number;
  highestPrice?: number;
};

/** Only offers choices that match at least one listing, so no option leads to an empty page. */
export function searchOptions(properties: Searchable[]): SearchOptions {
  const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
  const types = new Set<string>();
  const cities = new Map<string, Set<string>>();
  let mostBedrooms = 0;
  let lowestPrice = Number.POSITIVE_INFINITY;
  let highestPrice = 0;

  for (const property of properties) {
    types.add(property.type);
    // A neighborhood saved without a city has no place in the location list.
    if (property.city) {
      const neighborhoods = cities.get(property.city) ?? new Set<string>();
      if (property.neighborhood) neighborhoods.add(property.neighborhood);
      cities.set(property.city, neighborhoods);
    }
    mostBedrooms = Math.max(mostBedrooms, property.bedrooms ?? 0);
    if (property.price) {
      lowestPrice = Math.min(lowestPrice, property.price);
      highestPrice = Math.max(highestPrice, property.price);
    }
  }

  return {
    types: [...types].sort(byName),
    cities: [...cities]
      .map(([name, neighborhoods]) => ({ name, neighborhoods: [...neighborhoods].sort(byName) }))
      .sort((a, b) => cityRank(a.name) - cityRank(b.name) || byName(a.name, b.name)),
    bedrooms: BEDROOM_MINIMUMS.filter((minimum) => minimum <= mostBedrooms),
    priceCeilings: PRICE_CEILINGS.filter((ceiling) => ceiling >= lowestPrice),
    lowestPrice: highestPrice > 0 ? lowestPrice : undefined,
    highestPrice: highestPrice > 0 ? highestPrice : undefined,
  };
}

export const bedroomsLabel = (minimum: number) => `${minimum} ou mais ${plural(minimum, 'quarto', 'quartos')}`;

export type FilterChipKey = 'busca' | 'codigo' | 'tipo' | 'local' | 'dormitorios' | 'valorMin' | 'valorMax';
export type FilterChip = { key: FilterChipKey; label: string; /** Which one of several selected values this chip removes. */ value?: string };

/** "3 quartos", "2 e 3 quartos", "3 ou mais quartos", "1, 2 e 4 ou mais quartos". */
export function bedroomsSummary(counts: number[]) {
  const from = bedroomsFrom(counts);
  if (from !== undefined) return bedroomsLabel(from);
  const names = counts.map((count) => (count === MAX_BEDROOMS ? '4 ou mais' : String(count)));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names.at(-1)}` : names[0];
  return `${list} ${plural(counts.at(-1)!, 'quarto', 'quartos')}`;
}

const locationLabel = (place: string) => {
  const { cidade, bairro } = parseLocation(place);
  return [bairro, cidade].filter(Boolean).join(', ');
};

export function filterChips(filters: PropertyFilters): FilterChip[] {
  const several = <T extends FilterChipKey>(key: T, values: string[] | undefined, label: (value: string) => string) => (values ?? []).map((value) => ({ key, value, label: label(value) }));
  const chips: (FilterChip | false)[] = [
    !!filters.busca && { key: 'busca', label: `“${filters.busca}”` },
    !!filters.codigo && { key: 'codigo', label: `Código ${filters.codigo}` },
    !!filters.tipo && { key: 'tipo', label: filters.tipo },
    ...several('tipo', filters.tipos, (type) => type),
    !!(filters.bairro || filters.cidade) && {
      key: 'local',
      label: [filters.bairro, filters.cidade].filter(Boolean).join(', '),
    },
    ...several('local', filters.locais, locationLabel),
    !!filters.quartos?.length && { key: 'dormitorios', label: bedroomsSummary(filters.quartos) },
    filters.valorMin !== undefined && { key: 'valorMin', label: `A partir de ${formatPriceShort(filters.valorMin)}` },
    filters.valorMax !== undefined && { key: 'valorMax', label: `Até ${formatPriceShort(filters.valorMax)}` },
  ];
  return chips.filter((chip) => chip !== false);
}

export function removeFilter(filters: PropertyFilters, key: FilterChipKey, value?: string): PropertyFilters {
  if (key === 'local') return withLocations(filters, value ? selectedLocations(filters).filter((place) => place !== value) : []);
  if (key === 'tipo') return withTypes(filters, value ? selectedTypes(filters).filter((type) => type !== value) : []);
  if (key === 'dormitorios') return { ...filters, quartos: undefined };
  return { ...filters, [key]: undefined };
}

/** The fields the live result count reads, so the browser gets no more than that. */
export const countRow = ({ code, type, city, neighborhood, price, bedrooms, area }: Searchable): Searchable => ({ code, type, city, neighborhood, price, bedrooms, area });
