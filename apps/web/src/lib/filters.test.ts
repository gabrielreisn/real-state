import { describe, expect, it } from 'vitest';
import { properties } from '@/test/properties';
import {
  bedroomsSummary,
  filterChips,
  isCombinedSearch,
  toggleLocation,
  withLocations,
  withTypes,
  filterProperties,
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

describe('searchOptions', () => {
  it('reports the published price range, ignoring listings without a price', () => {
    const options = searchOptions(properties);
    expect(options.lowestPrice).toBe(500023);
    expect(options.highestPrice).toBe(4690000);
    expect(searchOptions([{ ...properties[0], price: null }]).lowestPrice).toBeUndefined();
  });

  it('offers no neighborhood for a listing that only has a city', () => {
    const options = searchOptions([{ ...properties[0], city: 'Vitória', neighborhood: '' }]);
    expect(options.cities).toEqual([{ name: 'Vitória', neighborhoods: [] }]);
  });

  it('lists cities by demand, then any others by name, and skips a blank city', () => {
    const at = (city: string) => ({ ...properties[0], city });
    const names = searchOptions(['Fundão', 'Serra', '', 'Linhares', 'Aracruz', 'Vitória'].map(at)).cities.map((city) => city.name);
    expect(names).toEqual(['Vitória', 'Serra', 'Fundão', 'Aracruz', 'Linhares']);
  });

  it('only offers choices that match at least one listing', () => {
    const options = searchOptions(properties);
    expect(options.types).toEqual(['Apartamento']);
    expect(options.cities.map((city) => city.name)).toEqual(['Vitória', 'Vila Velha']);
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

describe('multiple choices', () => {
  const codes = (params: Record<string, string | string[]>) => filterProperties(properties, parseFilters(params)).map(({ code }) => code);

  it('matches any of several places, types and bedroom counts', () => {
    expect(codes({ local: ['b|Vila Velha|Itapuã', 'b|Vitória|Praia do Canto'] })).toEqual(['1168', '1136']);
    expect(codes({ local: ['c|Vitória', 'b|Vila Velha|Itapuã'] })).toEqual(['1168', '1152', '1136', '1115']);
    expect(codes({ dormitorios: ['2', '4'], local: ['c|Vitória', 'c|Vila Velha'] })).toEqual(['1168', '1150', '1136', '1125']);
  });

  it('keeps a single choice in the fields that have their own page', () => {
    expect(parseFilters({ local: 'c|Serra', tipo: 'Casa' })).toMatchObject({ cidade: 'Serra', tipo: 'Casa', locais: undefined, tipos: undefined });
    expect(withLocations({}, ['b|Serra|Laranjeiras'])).toMatchObject({ cidade: 'Serra', bairro: 'Laranjeiras', locais: undefined });
    expect(withTypes({ tipo: 'Casa' }, ['Casa', 'Sobrado'])).toMatchObject({ tipo: undefined, tipos: ['Casa', 'Sobrado'] });
  });

  it('a whole city and its neighborhoods replace each other', () => {
    expect(toggleLocation(['b|Serra|A', 'b|Vitória|B'], 'c|Serra')).toEqual(['b|Vitória|B', 'c|Serra']);
    expect(toggleLocation(['c|Serra'], 'b|Serra|A')).toEqual(['b|Serra|A']);
    expect(toggleLocation(['b|Serra|A', 'b|Serra|B'], 'b|Serra|A')).toEqual(['b|Serra|B']);
  });

  it('describes bedroom choices', () => {
    expect(bedroomsSummary([3])).toBe('3 quartos');
    expect(bedroomsSummary([2, 3])).toBe('2 e 3 quartos');
    expect(bedroomsSummary([3, 4])).toBe('3 ou mais quartos');
    expect(bedroomsSummary([1, 2, 4])).toBe('1, 2 e 4 ou mais quartos');
  });

  it('gives each selected value its own removable chip', () => {
    const filters = parseFilters({ tipo: ['Casa', 'Sobrado'] });
    const [first] = filterChips(filters);
    expect(first).toMatchObject({ key: 'tipo', value: 'Casa', label: 'Casa' });
    expect(removeFilter(filters, 'tipo', first.value)).toMatchObject({ tipo: 'Sobrado', tipos: undefined });
  });

  it('only combined searches stay out of search engines', () => {
    expect(isCombinedSearch({ cidade: 'Serra', tipo: 'Casa', quartos: [3, 4] })).toBe(false);
    expect(isCombinedSearch({ tipos: ['Casa', 'Sobrado'] })).toBe(true);
  });
});
