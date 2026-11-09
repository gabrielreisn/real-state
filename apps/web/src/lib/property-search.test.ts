import { describe, expect, it } from 'vitest';
import { filterProperties } from './filters';
import { createSearcher, highlightParts, normalize, type SearchFields } from './property-search';
import { createSuggester, listingForCode, type SuggestionListing } from './search-suggestions';

const listing = (fields: Pick<SearchFields, 'code' | 'neighborhood' | 'city'> & Partial<SearchFields>): SuggestionListing => ({
  type: 'Apartamento',
  href: `/imovel/${fields.code}/x`,
  ...fields,
});

const listings = [
  listing({ code: '1170', city: 'Vila Velha', neighborhood: 'Praia de Itaparica', excerpt: 'Alto padrão no American Towers, frente para o mar.' }),
  listing({ code: '1059', city: 'Vila Velha', neighborhood: 'Praia da Costa', condominium: 'Edifício Monalisa' }),
  listing({ code: '1060', city: 'Vila Velha', neighborhood: 'Praia da Costa', condominium: 'Edifício Monalisa' }),
  listing({ code: '1025', city: 'Vitória', neighborhood: 'Santa Lúcia', address: 'Avenida Marechal Campos', type: 'Casa Comercial' }),
  listing({ code: '0740', city: 'Vitória', neighborhood: 'Jardim Camburi' }),
  listing({ code: '937', city: 'Serra', neighborhood: 'Jardim Limoeiro', type: 'Terreno' }),
];

const codes = (query: string) => createSearcher(listings)(query).map(({ code }) => code);
const suggest = createSuggester(listings);

describe('normalize', () => {
  it('ignores accents, case and punctuation', () => {
    expect(normalize('  Santa LÚCIA, Vitória! ')).toBe('santa lucia vitoria');
  });
});

describe('highlightParts', () => {
  it('marks searched words ignoring accents and case', () => {
    expect(highlightParts('Santa Lúcia', 'lucia')).toEqual([{ text: 'Santa ', match: false }, { text: 'Lúcia', match: true }]);
  });

  it('marks nothing for a typo', () => {
    expect(highlightParts('Monalisa', 'monaliza')).toEqual([{ text: 'Monalisa', match: false }]);
  });
});

describe('searching listings', () => {
  it('finds by neighborhood without accents', () => {
    expect(codes('santa lucia')).toEqual(['1025']);
  });

  it('finds by building, street and code', () => {
    expect(codes('monalisa')).toEqual(['1059', '1060']);
    expect(codes('rua marechal campos')).toEqual(['1025']);
    expect(codes('1170')).toEqual(['1170']);
  });

  it('finds a code typed without its leading zero', () => {
    expect(codes('740')).toEqual(['0740']);
  });

  it('tolerates typos', () => {
    expect(codes('monaliza')).toEqual(['1059', '1060']);
    expect(codes('camburu')).toEqual(['0740']);
  });

  it('does not count typos when a direct match exists', () => {
    expect(codes('serra')).toEqual(['937']);
  });

  it('combines words across fields', () => {
    expect(codes('terreno serra')).toEqual(['937']);
    expect(codes('casa vitoria')).toEqual(['1025']);
  });

  it('falls back to the listing text for names missing from the fields', () => {
    expect(codes('american towers')).toEqual(['1170']);
  });

  it('finds nothing when a word matches nowhere', () => {
    expect(codes('monalisa xyzabc')).toEqual([]);
  });

  it('filters the listings page', () => {
    expect(filterProperties(listings.map((item) => ({ ...item, price: null })), { busca: 'monalisa' }).map(({ code }) => code)).toEqual(['1059', '1060']);
  });
});

describe('suggestions', () => {
  it('leads with the exact code and opens the listing', () => {
    expect(suggest('1170')[0]).toMatchObject({ kind: 'Código', label: '1170', href: '/imovel/1170/x' });
  });

  it('groups a building with several listings into one search', () => {
    expect(suggest('monalisa')[0]).toMatchObject({ kind: 'Condomínio', label: 'Edifício Monalisa', href: '/imoveis?busca=Edif%C3%ADcio+Monalisa' });
  });

  it('opens the listing when a street has only one', () => {
    expect(suggest('marechal')[0]).toMatchObject({ kind: 'Endereço', href: '/imovel/1025/x' });
  });

  it('links a neighborhood to its page', () => {
    expect(suggest('praia da costa')[0]).toMatchObject({ kind: 'Bairro', label: 'Praia da Costa', href: '/imoveis/vila-velha/praia-da-costa' });
  });

  it('puts the closest name first', () => {
    expect(suggest('vitoria')[0]).toMatchObject({ kind: 'Cidade', label: 'Vitória' });
  });

  it('shows a listing found only in its text', () => {
    expect(suggest('american')).toEqual([expect.objectContaining({ kind: 'Imóvel', label: 'Código 1170' })]);
  });

  it('never repeats a destination', () => {
    const hrefs = suggest('marechal').map(({ href }) => href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe('listingForCode', () => {
  it('recognizes a code however it is typed', () => {
    expect(listingForCode(listings, '#1170')?.code).toBe('1170');
    expect(listingForCode(listings, 'código 740')?.code).toBe('0740');
  });

  it('ignores anything else', () => {
    expect(listingForCode(listings, 'monalisa')).toBeUndefined();
    expect(listingForCode(listings, '11')).toBeUndefined();
  });
});
