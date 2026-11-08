import { defineLive } from 'next-sanity/live';
import { client, readToken } from './client';

/**
 * Visitors get published content, cached until Sanity reports a change: <SanityLive /> in the
 * layout listens for changes and revalidates only the queries they touch. In preview mode (Draft
 * Mode, switched on from the Studio) the same queries read drafts, uncached and with click-to-edit
 * markers.
 */
const live = defineLive({
  client,
  serverToken: readToken || false,
  // Sent to the browser only while preview mode is on, so drafts update live outside the Studio too.
  browserToken: readToken || false,
});

export const SanityLive = live.SanityLive;

type FetchOptions = {
  /**
   * Always read published content without markers, even in preview mode. For anything that is not
   * rendered as page text: static params, the sitemap, metadata and generated images.
   */
  published?: boolean;
};

export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}, { published = false }: FetchOptions = {}) {
  const { data } = await live.sanityFetch(published ? { query, params, perspective: 'published', stega: false } : { query, params });
  return data as T;
}
