import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config, proxy } from '../../proxy';
import { legacyRedirect } from './legacy-url';
import properties from './legacy-properties.json';

const origin = 'https://www.alexnolasco.com.br';
const cases = [
  ['/imovel/venda/comercial/vila-velha?amp=1', '/imoveis/vila-velha?tipo=Comercial'],
  ['/imovel/venda/apartamento/vila-velha/jockey-de-itaparica-683421?amp=1', '/imoveis/vila-velha/jockey-de-itaparica?tipo=Apartamento'],
  ['/imovel/venda/casa/serra/manguinhos-yahoo-residences-680171?amp=1', '/imoveis/serra/manguinhos-yahoo-residences?tipo=Casa'],
  ['/imovel/3610394/casa-venda-vitoria-es-bento-ferreira?amp=1', properties['3610394']],
  ['/imovel/3530253/casa-venda-serra-es-colina-de-laranjeiras?amp=1', properties['3530253']],
  ['/imovel/venda/apartamento/vitoria/itapua-543995?amp=1', '/imoveis/vila-velha/itapua?tipo=Apartamento'],
  ['/imovel/3358843/apartamento-venda-vila-velha-es-itaparica?amp=1', properties['3358843']],
  ['/imovel/2997028/apartamento-venda-vitoria-es-jardim-camburi?amp=1', properties['2997028']],
  ['/imovel/venda/terreno/domingos-martins?amp=1', '/imoveis/domingos-martins?tipo=Terreno'],
  ['/imovel/venda/loja-comercial/serra?amp=1', '/imoveis/serra?tipo=Loja+Comercial'],
  ['/mobile/imovel/3614859/chacara-venda-serra-es-marbela', '/imovel/1131/chacara-venda-serra-es-marbela'],
  ['/imovel/venda/apartamento/vitoria/jardim-da-penha-543374/?&dormitorios=1&amp=1', '/imoveis/vitoria/jardim-da-penha?dormitorios=1&tipo=Apartamento'],
  ['/mobile/imovel/venda/casa/serra', '/imoveis/serra?tipo=Casa'],
  ['/imovel/venda/casa/vitoria/bairro-republica-560330/?&dormitorios=3&amp=1', '/imoveis/vitoria/bairro-republica?dormitorios=3&tipo=Casa'],
  ['/mobile/imovel/venda/sobrado/serra/?&pag=1', '/imoveis/serra?tipo=Sobrado'],
  ['/mobile/imovel/3351347/apartamento-venda-vitoria-es-mata-da-praia', properties['3351347']],
  ['/mobile/imovel/3496581/terreno-venda-serra-es-arquipelago-manguinhos', properties['3496581']],
  ['/mobile/imovel/venda/casa/vitoria/santa-cecilia-657138/?pag=1', '/imoveis/vitoria/santa-cecilia?tipo=Casa'],
  ['/mobile/imovel/3710946/apartamento-venda-vitoria-es-jardim-camburi', properties['3710946']],
  ['/mobile/imovel/2888712/apartamento-venda-vitoria-es-jardim-camburi', properties['2888712']],
];

describe('Search Console legacy redirects', () => {
  it.each(cases)('%s', (source, destination) => {
    const url = origin + source;
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    const response = proxy(new NextRequest(url));
    expect(response.status).toBe(308);
    const target = new URL(response.headers.get('location')!);
    const expected = new URL(destination, origin);
    expect(target.pathname).toBe(expected.pathname);
    expect([...target.searchParams].sort()).toEqual([...expected.searchParams].sort());
    expect(legacyRedirect(target)).toBeNull();
  });

  it('preserves filters, repeated values and tracking, translates pagination, removes all AMP values', () => {
    const target = legacyRedirect(new URL(origin + '/mobile/imovel/venda/chacara/serra?amp=1&amp=0&dormitorios=2&dormitorios=3&pag=2&utm_source=google'))!;
    expect(target.pathname).toBe('/imoveis/serra');
    expect(Object.fromEntries(target.searchParams)).toEqual({ dormitorios: '3', pagina: '2', tipo: 'Chácara', utm_source: 'google' });
    expect(target.searchParams.getAll('dormitorios')).toEqual(['2', '3']);
  });

  it('removes AMP from current pages without losing filters', () => {
    expect(legacyRedirect(new URL(origin + '/imoveis/serra?tipo=Casa&amp=1'))?.href).toBe(origin + '/imoveis/serra?tipo=Casa');
    expect(legacyRedirect(new URL(origin + '/imovel/1131/chacara-venda-serra-es-marbela?amp=1'))?.pathname).toBe('/imovel/1131/chacara-venda-serra-es-marbela');
  });

  it.each(['/imovel', '/mobile/imovel', '/mobile/imoveis'])('redirects %s to listings', (path) => {
    expect(legacyRedirect(new URL(origin + path))?.pathname).toBe('/imoveis');
  });

  it('leaves canonical pages and unknown property IDs alone', () => {
    for (const path of ['/imoveis/serra?tipo=Casa', '/imovel/9999999/unknown', '/imovel/1131/chacara-venda-serra-es-marbela']) {
      expect(legacyRedirect(new URL(origin + path))).toBeNull();
    }
  });

  it('does not run on assets or API requests with AMP parameters', () => {
    for (const path of ['/api/imoveis/1131?amp=1', '/_next/static/file.js?amp=1', '/logo.png?amp=1']) {
      expect(unstable_doesMiddlewareMatch({ config, url: origin + path })).toBe(false);
    }
  });
});
