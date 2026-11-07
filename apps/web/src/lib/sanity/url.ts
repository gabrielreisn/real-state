/** Adds Sanity image CDN parameters without clobbering ones already in the URL, such as a crop `rect`. */
export function withImageParams(src: string, params: Record<string, string | number>) {
  const url = new URL(src);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url.toString();
}
