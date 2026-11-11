import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

// Same rules as the website's slugify (apps/web/src/lib/listings-url.ts), which builds listing URLs from names.
const slugify = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type Location = { title: string; href: string };

/** The document fields the site builds its URLs from, flattened. */
export type PathFields = {
  title?: string;
  type?: string;
  code?: string;
  slug?: string;
  name?: string;
  city?: string;
  available?: boolean;
};

const LISTINGS: Location = { title: 'Imóveis à venda', href: '/imoveis' };

/**
 * The site pages that show a document, most relevant first. Used by the "Used on … pages" panel
 * and by the "Pré-visualizar" action, which opens the first one. Empty when the document has no
 * page yet (e.g. a listing without a slug).
 */
export function documentLocations(schemaType: string, doc: PathFields): Location[] {
  switch (schemaType) {
    case 'property':
      if (!doc.slug || !doc.code || doc.available === false) return [];
      return [{ title: doc.title || `${doc.type} · código ${doc.code}`, href: `/imovel/${doc.code}/${doc.slug}` }, LISTINGS];
    case 'neighborhood':
      return doc.name && doc.city ? [{ title: `Imóveis em ${doc.name}, ${doc.city}`, href: `/imoveis/${slugify(doc.city)}/${slugify(doc.name)}` }] : [];
    case 'page':
      return doc.slug ? [{ title: doc.title || doc.slug, href: `/${doc.slug}` }] : [];
    case 'siteSettings':
      return [{ title: 'Página inicial', href: '/' }, LISTINGS];
    default:
      return [];
  }
}

const SELECT: Record<string, Record<string, string>> = {
  property: { title: 'title', type: 'type', code: 'code', slug: 'slug.current', available: 'available' },
  neighborhood: { name: 'name', city: 'city' },
  page: { title: 'title', slug: 'slug.current' },
  siteSettings: {},
};

const MISSING: Record<string, string> = {
  property: 'Defina o código e o slug para ver o imóvel no site.',
  neighborhood: 'Defina o nome e a cidade para ver o bairro no site.',
  page: 'Defina o slug para ver a página no site.',
};

/** Which pages of the site show each document: listed in the editor, and opened in the preview. */
export const resolve: PresentationPluginOptions['resolve'] = {
  // The document to edit when the preview navigates to a page.
  mainDocuments: defineDocuments([
    { route: '/imovel/:id/:slug', filter: `_type == "property" && code == $id` },
    { route: '/:page', filter: `_type == "page" && slug.current == $page` },
  ]),
  locations: Object.fromEntries(
    Object.entries(SELECT).map(([schemaType, select]) => [
      schemaType,
      defineLocations({
        select,
        resolve: (doc) => {
          if (schemaType === 'property' && doc?.available === false) return { message: 'Imóvel indisponível: oculto no site e nos buscadores.', tone: 'caution' };
          const locations = documentLocations(schemaType, (doc ?? {}) as PathFields);
          if (locations.length > 0) return { locations, ...(schemaType === 'siteSettings' ? { message: 'Usado em todas as páginas do site.' } : {}) };
          return MISSING[schemaType] ? { message: MISSING[schemaType], tone: 'caution' } : null;
        },
      }),
    ]),
  ),
};
