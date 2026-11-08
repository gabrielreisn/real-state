import { createClient, type StegaConfig } from 'next-sanity';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env (see README).`);
  return value;
}

export const sanityConfig = {
  projectId: required('SANITY_PROJECT_ID'),
  dataset: required('SANITY_DATASET'),
};

export const apiVersion = '2025-02-19';

/** Viewer token: reads drafts in preview mode. Server only, never sent to visitors. */
export const readToken = process.env.SANITY_API_READ_TOKEN;

// The Studio has one workspace per dataset, at /production and /development.
const studioUrl = `${process.env.SANITY_STUDIO_URL ?? 'https://alexnolasco.sanity.studio'}/${sanityConfig.dataset}`;

/**
 * Fields that get click-to-edit markers in preview mode. Stega hides invisible characters inside
 * strings, so only display text is marked: names, slugs, codes, types, phone numbers and the like
 * feed URLs, filters and comparisons, and must stay clean.
 */
const EDITABLE: Record<string, string[]> = {
  property: ['title', 'summary', 'excerpt', 'address', 'condominium', 'description', 'featureGroups'],
  page: ['title', 'description', 'body', 'formTitle'],
};

const stega: StegaConfig = {
  studioUrl,
  filter: (props) => {
    const fields = EDITABLE[props.sourceDocument?._type ?? ''];
    const field = props.sourcePath[0];
    if (!fields || typeof field !== 'string' || !fields.includes(field)) return false;
    return props.filterDefault(props);
  },
};

export const client = createClient({
  ...sanityConfig,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega,
});
