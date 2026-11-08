import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

// Same rules as the website's slugify (apps/web/src/lib/listings-url.ts), which builds listing URLs from names.
const slugify = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const HOME = { title: 'Página inicial', href: '/' };

/** Which pages of the site show each document: listed in the editor, and opened in the preview. */
export const resolve: PresentationPluginOptions['resolve'] = {
  // The document to edit when the preview navigates to a page.
  mainDocuments: defineDocuments([
    { route: '/imovel/:id/:slug', filter: `_type == "property" && coalesce(legacyId, code) == $id` },
    { route: '/:page', filter: `_type == "page" && slug.current == $page` },
  ]),
  locations: {
    property: defineLocations({
      select: { title: 'title', type: 'type', code: 'code', legacyId: 'legacyId', slug: 'slug.current', externalUrl: 'externalUrl' },
      resolve: (doc) => {
        if (!doc?.slug) return { message: 'Defina o slug para ver o imóvel no site.', tone: 'caution' };
        if (doc.externalUrl) return { message: 'Este imóvel ainda abre no site antigo (Link externo).', tone: 'caution' };
        return {
          locations: [
            { title: doc.title || `${doc.type} · código ${doc.code}`, href: `/imovel/${doc.legacyId || doc.code}/${doc.slug}` },
            { title: 'Imóveis à venda', href: '/imoveis' },
          ],
        };
      },
    }),
    neighborhood: defineLocations({
      select: { name: 'name', city: 'city' },
      resolve: (doc) =>
        doc?.name && doc.city
          ? { locations: [{ title: `Imóveis em ${doc.name}, ${doc.city}`, href: `/imoveis/${slugify(doc.city)}/${slugify(doc.name)}` }] }
          : null,
    }),
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => (doc?.slug ? { locations: [{ title: doc.title || doc.slug, href: `/${doc.slug}` }] } : null),
    }),
    siteSettings: defineLocations({
      message: 'Usado em todas as páginas do site.',
      locations: [HOME, { title: 'Imóveis à venda', href: '/imoveis' }],
    }),
  },
};
