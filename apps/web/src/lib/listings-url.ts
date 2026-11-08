import type { PropertySummary } from '@/content/types';
import { DEFAULT_SORT, type PropertyFilters, type SortOrder } from './filters';

export const LISTINGS_PATH = '/imoveis';
export const PAGE_SIZE = 24;

export const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * The URL of a listings search. Location is part of the path (/imoveis/vila-velha/praia-da-costa)
 * so every city and neighborhood has its own indexable page; everything else is a query parameter.
 */
export function listingsHref(filters: PropertyFilters, sort: SortOrder = DEFAULT_SORT, page = 1) {
  const segments = [LISTINGS_PATH];
  if (filters.cidade) {
    segments.push(slugify(filters.cidade));
    if (filters.bairro) segments.push(slugify(filters.bairro));
  }
  const params = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ['tipo', filters.tipo],
    ['dormitorios', filters.dormitorios === undefined ? undefined : `${filters.dormitorios}${filters.dormitoriosOuMais ? '+' : ''}`],
    ['valorMin', filters.valorMin],
    ['valorMax', filters.valorMax],
    ['codigo', filters.codigo],
    ['ordem', sort === DEFAULT_SORT ? undefined : sort],
    ['pagina', page > 1 ? page : undefined],
  ];
  for (const [key, value] of entries) if (value !== undefined) params.set(key, String(value));
  const query = params.toString();
  return `${segments.join('/')}${query ? `?${query}` : ''}`;
}

/**
 * Turns path segments back into a city and neighborhood, matching the names that listings use.
 * Returns null when the path names a place with no listings, so the page can 404.
 */
export function resolveLocation(segments: string[], properties: Pick<PropertySummary, 'city' | 'neighborhood'>[]): Pick<PropertyFilters, 'cidade' | 'bairro'> | null {
  if (segments.length === 0) return {};
  if (segments.length > 2) return null;
  const [citySlug, neighborhoodSlug] = segments;
  const inCity = properties.filter((property) => slugify(property.city) === citySlug);
  if (inCity.length === 0) return null;
  const cidade = inCity[0].city;
  if (!neighborhoodSlug) return { cidade };
  const match = inCity.find((property) => slugify(property.neighborhood) === neighborhoodSlug);
  return match ? { cidade, bairro: match.neighborhood } : null;
}

export function parsePage(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

/** "apartamento" → "apartamentos", "galpão" → "galpões", "casa em condomínio" → "casas em condomínio". */
export function pluralType(type: string) {
  const [first, ...rest] = type.toLowerCase().split(' ');
  if (first === 'prontos') return type.toLowerCase();
  const plural = first.endsWith('ão') ? `${first.slice(0, -2)}ões` : first.endsWith('l') ? `${first.slice(0, -1)}is` : `${first}s`;
  return [plural, ...rest].join(' ');
}

/** "59 apartamentos à venda em Praia da Costa, Vila Velha", used as the page heading and title. */
export function listingsHeading(filters: PropertyFilters, count?: number) {
  const subject = filters.tipo ? pluralType(filters.tipo) : 'imóveis';
  const place = filters.bairro && filters.cidade ? `${filters.bairro}, ${filters.cidade}` : (filters.cidade ?? 'toda a Grande Vitória');
  const what = `${subject} à venda em ${place}`;
  if (count === undefined) return what.charAt(0).toUpperCase() + what.slice(1);
  return `${count} ${count === 1 && !filters.tipo ? 'imóvel' : subject} à venda em ${place}`;
}
