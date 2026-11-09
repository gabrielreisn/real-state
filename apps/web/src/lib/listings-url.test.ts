import { describe, expect, it } from 'vitest';
import { properties } from '@/test/properties';
import { listingsHeading, listingsHref, parsePage, pluralType, resolveLocation, slugify } from './listings-url';

describe('listingsHref', () => {
  it('puts the location in the path and the rest in the query', () => {
    expect(listingsHref({})).toBe('/imoveis');
    expect(listingsHref({ cidade: 'Vila Velha' })).toBe('/imoveis/vila-velha');
    expect(listingsHref({ cidade: 'Vila Velha', bairro: 'Itapuã', tipo: 'Apartamento', quartos: [2, 3, 4] })).toBe(
      '/imoveis/vila-velha/itapua?tipo=Apartamento&dormitorios=2%2B',
    );
  });

  it('only adds the sort and page when they are not the defaults', () => {
    expect(listingsHref({ valorMax: 1500000 }, 'menor-preco', 3)).toBe('/imoveis?valorMax=1500000&ordem=menor-preco&pagina=3');
    expect(listingsHref({}, 'recentes', 1)).toBe('/imoveis');
  });

  it('ignores a neighborhood without its city', () => {
    expect(listingsHref({ bairro: 'Itapuã' })).toBe('/imoveis');
  });
});

describe('resolveLocation', () => {
  it('maps slugs back to the names listings use', () => {
    expect(resolveLocation([], properties)).toEqual({});
    expect(resolveLocation(['vitoria'], properties)).toEqual({ cidade: 'Vitória' });
    expect(resolveLocation(['vila-velha', 'praia-da-costa'], properties)).toEqual({ cidade: 'Vila Velha', bairro: 'Praia da Costa' });
  });

  it('returns null for places without listings or too many segments', () => {
    expect(resolveLocation(['curitiba'], properties)).toBeNull();
    expect(resolveLocation(['vitoria', 'praia-da-costa'], properties)).toBeNull();
    expect(resolveLocation(['vitoria', 'jardim-camburi', 'extra'], properties)).toBeNull();
  });
});

describe('helpers', () => {
  it('slugifies accents and spaces', () => {
    expect(slugify('Jardim da Penha')).toBe('jardim-da-penha');
    expect(slugify('Itapuã')).toBe('itapua');
  });

  it('parses page numbers defensively', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('-2')).toBe(1);
    expect(parsePage('abc')).toBe(1);
  });

  it('pluralizes property types in Portuguese', () => {
    expect(pluralType('Apartamento')).toBe('apartamentos');
    expect(pluralType('Galpão')).toBe('galpões');
    expect(pluralType('Casa em Condomínio')).toBe('casas em condomínio');
    expect(pluralType('Comercial')).toBe('comerciais');
    expect(pluralType('Prontos para Morar')).toBe('prontos para morar');
  });

  it('builds headings for any combination of filters', () => {
    expect(listingsHeading({}, 259)).toBe('259 imóveis à venda em toda a Grande Vitória');
    expect(listingsHeading({ cidade: 'Vila Velha', bairro: 'Itapuã', tipo: 'Apartamento' }, 2)).toBe('2 apartamentos à venda em Itapuã, Vila Velha');
    expect(listingsHeading({ cidade: 'Serra' }, 1)).toBe('1 imóvel à venda em Serra');
    expect(listingsHeading({ tipo: 'Casa' })).toBe('Casas à venda em toda a Grande Vitória');
  });
});

describe('combined searches', () => {
  it('keeps several places out of the path', () => {
    expect(listingsHref({ locais: ['c|Serra', 'b|Vitória|Praia do Canto'] })).toBe('/imoveis?local=c%7CSerra&local=b%7CVit%C3%B3ria%7CPraia+do+Canto');
  });

  it('repeats values for several types and bedrooms', () => {
    expect(listingsHref({ tipos: ['Casa', 'Sobrado'], quartos: [2, 3] })).toBe('/imoveis?tipo=Casa&tipo=Sobrado&dormitorios=2&dormitorios=3');
  });

  it('names few places and counts many', () => {
    expect(listingsHeading({ locais: ['c|Serra', 'b|Vitória|Praia do Canto'] }, 4)).toBe('4 imóveis à venda em Serra e Praia do Canto');
    expect(listingsHeading({ locais: ['c|Serra', 'c|Vitória', 'c|Fundão'] }, 4)).toBe('4 imóveis à venda em 3 locais');
  });
});
