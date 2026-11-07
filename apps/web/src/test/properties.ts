import type { PropertySummary } from '@/content/types';

type Fixture = Pick<PropertySummary, 'code' | 'city' | 'neighborhood' | 'price'> & Partial<PropertySummary>;

const listing = (fields: Fixture): PropertySummary => ({
  id: fields.code,
  slug: `imovel-${fields.code}`,
  type: 'Apartamento',
  purpose: 'Venda',
  state: 'ES',
  image: { src: `https://cdn.sanity.io/images/test/test/${fields.code}-800x600.jpg`, alt: '' },
  excerpt: '',
  href: `/imovel/${fields.code}/imovel-${fields.code}`,
  ...fields,
});

/** The nine listings on the landing page when the site moved to Sanity. */
export const properties: PropertySummary[] = [
  listing({ code: '1170', city: 'Vila Velha', neighborhood: 'Praia de Itaparica', price: 1530000, area: 125, bedrooms: 3, suites: 2, bathrooms: 3, parking: 2 }),
  listing({ code: '1168', city: 'Vila Velha', neighborhood: 'Itapuã', price: 850000, area: 70, bedrooms: 2, suites: 1, bathrooms: 2, parking: 3 }),
  listing({ code: '1167', city: 'Vila Velha', neighborhood: 'Praia da Costa', price: 695000, area: 102, bedrooms: 3, bathrooms: 2, parking: 1 }),
  listing({ code: '1165', city: 'Vila Velha', neighborhood: 'Praia da Costa', price: 1050000, area: 132, bedrooms: 3, suites: 1, parking: 1 }),
  listing({ code: '1152', city: 'Vitória', neighborhood: 'Jardim Camburi', price: 1026671, area: 10, bedrooms: 3, suites: 1, bathrooms: 2, parking: 1 }),
  listing({ code: '1150', city: 'Vila Velha', neighborhood: 'Jockey de Itaparica', price: 500023, area: 10, bedrooms: 2, suites: 1, bathrooms: 2, parking: 1 }),
  listing({ code: '1136', city: 'Vitória', neighborhood: 'Praia do Canto', price: 4690000, area: 240, bedrooms: 4, bathrooms: 5, parking: 2 }),
  listing({ code: '1125', city: 'Vila Velha', neighborhood: 'Praia de Itapuã', price: 680000, area: 68, bedrooms: 2, bathrooms: 2, parking: 1 }),
  listing({ code: '1115', city: 'Vitória', neighborhood: 'Jardim da Penha', price: null }),
];
