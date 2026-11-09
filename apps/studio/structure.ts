import type { StructureResolver } from 'sanity/structure';

export const SITE_SETTINGS_ID = 'siteSettings';

// These are the fields required for a document to be usable on the public site.
// This desk item deliberately checks persisted data instead of only Studio's current form state,
// so it also catches incomplete imports and older documents.
const CONTENT_WITH_ERRORS = /* groq */ `
  (_type == "property" && (
    !defined(code) || !defined(type) || !defined(slug.current) || !defined(coverImage.asset) ||
    (!defined(neighborhood) && !defined(city)) || count(gallery[!defined(asset._ref)]) > 0
  )) ||
  (_type == "neighborhood" && (!defined(name) || !defined(city) || !defined(slug.current))) ||
  (_type == "page" && (!defined(title) || !defined(slug.current)))
`;

// Site settings is a single document, so it opens directly instead of as a list.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Conteúdo')
    .items([
      S.listItem().title('Configurações do site').id(SITE_SETTINGS_ID).child(S.document().schemaType('siteSettings').documentId(SITE_SETTINGS_ID)),
      S.divider(),
      S.documentTypeListItem('property').title('Imóveis'),
      S.documentTypeListItem('neighborhood').title('Bairros'),
      S.documentTypeListItem('page').title('Páginas'),
      S.divider(),
      S.listItem()
        .title('Itens com erros')
        .id('content-errors')
        .child(S.documentList().title('Itens com erros').filter(CONTENT_WITH_ERRORS).defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])),
    ]);
