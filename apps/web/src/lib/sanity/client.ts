import { createClient } from '@sanity/client';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env (see README).`);
  return value;
}

export const sanityConfig = {
  projectId: required('SANITY_PROJECT_ID'),
  dataset: required('SANITY_DATASET'),
};

const client = createClient({
  ...sanityConfig,
  apiVersion: '2025-02-19',
  useCdn: true,
  perspective: 'published',
  // Only needed when the dataset is private.
  token: process.env.SANITY_API_READ_TOKEN,
});

/** Published content, cached by Next for a minute so edits show up without a redeploy. */
export function sanityFetch<T>(query: string, params: Record<string, unknown> = {}) {
  return client.fetch<T>(query, params, { next: { revalidate: 60, tags: ['sanity'] } });
}
