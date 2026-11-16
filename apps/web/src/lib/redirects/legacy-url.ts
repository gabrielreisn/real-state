import properties from './legacy-properties.json';
import neighborhoods from './legacy-neighborhoods.json';

const propertyPaths: Record<string, string> = properties;
const neighborhoodPaths: Record<string, string> = neighborhoods;
const types: Record<string, string> = {
  apartamento: 'Apartamento', casa: 'Casa', 'casa-comercial': 'Casa Comercial',
  'casa-em-condominio': 'Casa em Condomínio', chacara: 'Chácara', cobertura: 'Cobertura',
  comercial: 'Comercial', fazenda: 'Fazenda', galpao: 'Galpão', 'loja-comercial': 'Loja Comercial',
  'prontos-para-morar': 'Prontos para Morar', 'residencial-e-comercial': 'Residencial e Comercial',
  'sala-comercial': 'Sala Comercial', sitio: 'Sítio', sobrado: 'Sobrado', terreno: 'Terreno',
  'terreno-comercial': 'Terreno Comercial',
};

/** Resolve legacy routes and AMP variants together, keeping filters and tracking parameters. */
export function legacyRedirect(input: URL): URL | null {
  const target = new URL(input);
  target.searchParams.delete('amp');
  const path = input.pathname.replace(/\/$/, '').replace(/^\/mobile(?=\/imove(?:l|is)(?:\/|$))/, '');
  let legacySearch = false;

  if (path === '/imovel') {
    target.pathname = '/imoveis';
    legacySearch = true;
  } else {
    const search = path.match(/^\/imovel\/venda\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/);
    const detail = path.match(/^\/imovel\/(\d+)\/([^/]+)$/);
    if (search && Object.hasOwn(types, search[1])) {
      const [, type, city, neighborhood] = search;
      const neighborhoodId = neighborhood?.match(/-(\d+)$/)?.[1];
      target.pathname = (neighborhoodId && neighborhoodPaths[neighborhoodId]) ||
        `/imoveis/${city}${neighborhood ? `/${neighborhood.replace(/-\d+$/, '')}` : ''}`;
      target.searchParams.set('tipo', types[type]);
      legacySearch = true;
    } else if (detail) {
      target.pathname = propertyPaths[detail[1]] ?? path;
    } else if (input.pathname.startsWith('/mobile/imoveis')) {
      target.pathname = path;
      legacySearch = true;
    }
  }

  if (legacySearch) {
    const page = target.searchParams.get('pag');
    target.searchParams.delete('pag');
    if (page && /^\d+$/.test(page) && Number(page) > 1 && !target.searchParams.has('pagina')) {
      target.searchParams.set('pagina', page);
    }
    // Some old links use /?&dormitorios=3; URLSearchParams removes the empty separator.
    target.search = target.searchParams.toString();
  }
  return target.href === input.href ? null : target;
}
