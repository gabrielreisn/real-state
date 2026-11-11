import { client } from '@/lib/sanity/client';

/** Check published availability before Next streams the page or serves a cached HTML response. */
export async function isPropertyUnavailable(code: string) {
  const property = await client.withConfig({ useCdn: false, perspective: 'published', stega: false, timeout: 5000 }).fetch<{ available?: boolean } | null>(
    '*[_type == "property" && code == $code][0]{available}', { code }, { cache: 'no-store' },
  );
  return property?.available === false;
}
