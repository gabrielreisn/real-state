import type { Metadata } from 'next';

export const SITE_NAME = 'Alex Nolasco Imóveis';

/**
 * Search engines only index the site when ALLOW_INDEXING=true. Until launch the new site runs on
 * a preview domain and must not compete with www.alexnolasco.com.br in search results.
 */
export const indexable = process.env.ALLOW_INDEXING === 'true';

/** Next.js replaces (not merges) openGraph per page, so pages spread these defaults into theirs. */
export const openGraphDefaults = { type: 'website', locale: 'pt_BR', siteName: SITE_NAME } satisfies Metadata['openGraph'];
