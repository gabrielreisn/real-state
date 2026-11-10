import { describe, expect, it } from 'vitest';
import { parseFilters } from './filters';
import { homeSearchHref } from './home-search';

const filters = { quartos: [2, 4], valorMin: 500_000, valorMax: 1_500_000 };
const read = (href: string) => {
  const url = new URL(href, 'https://example.com');
  return { path: url.pathname, filters: parseFilters({ ...Object.fromEntries(url.searchParams), dormitorios: url.searchParams.getAll('dormitorios') }) };
};

describe('home search with extra filters', () => {
  it('searches bedrooms and price without requiring text', () => {
    expect(read(homeSearchHref('', filters))).toEqual({ path: '/imoveis', filters });
  });

  it('combines free text with multiple bedroom choices and a price range', () => {
    expect(read(homeSearchHref('  Praia da Costa ', filters))).toEqual({ path: '/imoveis', filters: { ...filters, busca: 'Praia da Costa' } });
  });

  it('preserves the city and neighborhood chosen in suggestions', () => {
    expect(read(homeSearchHref('praia', filters, '/imoveis/vila-velha/praia-da-costa'))).toEqual({ path: '/imoveis/vila-velha/praia-da-costa', filters });
  });

  it('preserves type and building suggestion parameters', () => {
    expect(read(homeSearchHref('ap', filters, '/imoveis?tipo=Apartamento&busca=Monalisa'))).toEqual({ path: '/imoveis', filters: { ...filters, tipo: 'Apartamento', busca: 'Monalisa' } });
  });

  it('does not bypass the budget when a code points directly to a property', () => {
    expect(read(homeSearchHref('1170', filters, '/imovel/1170/apartamento'))).toEqual({ path: '/imoveis', filters: { ...filters, busca: '1170' } });
  });

  it('keeps the existing property shortcut when filters are clear', () => {
    expect(homeSearchHref('1170', {}, '/imovel/1170/apartamento')).toBe('/imovel/1170/apartamento');
    expect(homeSearchHref('', {})).toBe('/imoveis');
  });

  it('overrides old filter values without duplicating parameters', () => {
    expect(read(homeSearchHref('vitoria', filters, '/imoveis/vitoria?dormitorios=1&valorMax=250000'))).toEqual({ path: '/imoveis/vitoria', filters });
  });
});
