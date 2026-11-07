import { describe, expect, it } from 'vitest';
import { properties } from '@/test/properties';
import {
  filterChips,
  filterProperties,
  filtersToSearch,
  hasActiveFilters,
  parseFilters,
  parseSort,
  removeFilter,
  searchOptions,
  sortProperties,
} from './filters';
import { formatPriceShort } from './format';

const codes = (params: Record<string, string>) =>
  filterProperties(properties, parseFilters(params)).map((property) => property.code);

describe('filterProperties', () => {
  it('returns everything without filters', () => {
    expect(codes({})).toHaveLength(properties.length);
    expect(hasActiveFilters(parseFilters({}))).toBe(false);
  });

  it('finds a listing by code, with or without #', () => {
    expect(codes({ codigo: '1170' })).toEqual(['1170']);
    expect(codes({ codigo: '#1170' })).toEqual(['1170']);
    expect(codes({ codigo: '9999' })).toEqual([]);
  });

  it('combines city and neighborhood', () => {
    expect(codes({ cidade: 'Vila Velha', bairro: 'Praia da Costa' })).toEqual(['1167', '1165']);
    expect(codes({ cidade: 'Vitória', bairro: 'Praia da Costa' })).toEqual([]);
  });

  it('reads the packed location value the search form submits without JavaScript', () => {
    expect(codes({ local: 'b|Vila Velha|Praia da Costa' })).toEqual(['1167', '1165']);
    expect(codes({ local: 'c|Vitória' })).toEqual(['1152', '1136', '1115']);
    expect(codes({ local: 'garbage' })).toHaveLength(properties.length);
  });

  it('applies inclusive price bounds and excludes listings without a price', () => {
    expect(codes({ valorMin: '1530000', valorMax: '1530000' })).toEqual(['1170']);
    expect(codes({ valorMax: '5000000' })).not.toContain('1115');
  });

  it('distinguishes exact bedrooms from "or more"', () => {
    expect(codes({ dormitorios: '4' })).toEqual(['1136']);
    expect(codes({ dormitorios: '3+' })).toEqual(['1170', '1167', '1165', '1152', '1136']);
    expect(codes({ dormitorios: '1+' })).not.toContain('1115');
  });

  it('ignores malformed values', () => {
    expect(hasActiveFilters(parseFilters({ valorMin: 'abc', valorMax: '-5', dormitorios: 'muitos', tipo: '  ' }))).toBe(false);
  });
});

describe('sortProperties', () => {
  const sorted = (order: string) => sortProperties(properties, parseSort({ ordem: order })).map((p) => p.code);

  it('puts the newest listing first by default and for unknown orders', () => {
    expect(sorted('')[0]).toBe('1170');
    expect(sorted('bogus')).toEqual(sorted(''));
  });

  it('sorts by price both ways, with unpriced listings last', () => {
    expect(sorted('menor-preco').slice(0, 2)).toEqual(['1150', '1125']);
    expect(sorted('maior-preco')[0]).toBe('1136');
    expect(sorted('menor-preco').at(-1)).toBe('1115');
    expect(sorted('maior-preco').at(-1)).toBe('1115');
  });

  it('sorts by area, largest first', () => {
    expect(sorted('maior-area')[0]).toBe('1136');
  });
});

describe('search URL', () => {
  it('round-trips filters and sort through the query string', () => {
    const filters = parseFilters({ tipo: 'Apartamento', cidade: 'Vila Velha', bairro: 'Itapuã', dormitorios: '2+', valorMax: '1500000' });
    const query = filtersToSearch(filters, 'menor-preco');
    const params = Object.fromEntries(new URLSearchParams(query));
    expect(parseFilters(params)).toEqual(filters);
    expect(parseSort(params)).toBe('menor-preco');
  });

  it('leaves the default sort out of the URL', () => {
    expect(filtersToSearch({}, 'recentes')).toBe('');
  });
});

describe('searchOptions', () => {
  it('only offers choices that match at least one listing', () => {
    const options = searchOptions(properties);
    expect(options.types).toEqual(['Apartamento']);
    expect(options.cities.map((city) => city.name)).toEqual(['Vila Velha', 'Vitória']);
    expect(options.bedrooms).toEqual([1, 2, 3, 4]);
    // The cheapest listing costs just over R$ 500 mil, so "up to R$ 500 mil" would always be empty.
    expect(options.priceCeilings[0]).toBe(750_000);
  });
});

describe('filter chips', () => {
  it('labels active filters in plain language and removes them as a group', () => {
    const filters = parseFilters({ cidade: 'Vila Velha', bairro: 'Itapuã', dormitorios: '3+', valorMax: '1500000' });
    expect(filterChips(filters).map((chip) => chip.label)).toEqual(['Itapuã, Vila Velha', '3 ou mais quartos', 'Até R$ 1,5 milhão']);
    expect(removeFilter(filters, 'local')).toMatchObject({ cidade: undefined, bairro: undefined });
  });

  it('formats short prices', () => {
    expect(formatPriceShort(750_000)).toBe('R$ 750 mil');
    expect(formatPriceShort(1_000_000)).toBe('R$ 1 milhão');
    expect(formatPriceShort(2_000_000)).toBe('R$ 2 milhões');
  });
});
