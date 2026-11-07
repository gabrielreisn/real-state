import type { StructureResolver } from 'sanity/structure';

export const SITE_SETTINGS_ID = 'siteSettings';

// Site settings is a single document, so it opens directly instead of as a list.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Conteúdo')
    .items([
      S.listItem().title('Configurações do site').id(SITE_SETTINGS_ID).child(S.document().schemaType('siteSettings').documentId(SITE_SETTINGS_ID)),
      S.divider(),
      S.documentTypeListItem('property').title('Imóveis'),
      S.documentTypeListItem('neighborhood').title('Bairros'),
    ]);
