/**
 * Step 1 of the ImobiBrasil import: downloads every public listing page from the current site
 * into import/.cache/pages, one request per second. Pages already cached are skipped, so the
 * crawl can be stopped and resumed.
 *
 *   node import/crawl.ts            # from apps/studio
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.alexnolasco.com.br';
const USER_AGENT = 'alexnolasco-site-migration (owner-authorized)';
const CACHE = path.join(import.meta.dirname, '.cache');
const PAGES = path.join(CACHE, 'pages');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchBytes(url: string) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Listing URLs from the sitemap: /imovel/<legacyId>/<slug>. */
export async function listingUrls() {
  const sitemap = (await fetchBytes(`${SITE}/sitemap.xml`)).toString('utf8');
  writeFileSync(path.join(CACHE, 'sitemap.xml'), sitemap);
  return [...new Set([...sitemap.matchAll(/<loc>([^<]*\/imovel\/\d+\/[^<]+)<\/loc>/g)].map((match) => match[1].trim()))];
}

async function crawl() {
  mkdirSync(PAGES, { recursive: true });
  const urls = await listingUrls();
  console.log(`${urls.length} listings in the sitemap.`);
  let fetched = 0;
  const failures: string[] = [];

  for (const [index, url] of urls.entries()) {
    const legacyId = url.match(/\/imovel\/(\d+)\//)![1];
    const file = path.join(PAGES, `${legacyId}.html`);
    if (!existsSync(file)) {
      try {
        // Written only after a complete download, so a failed request never leaves a partial file.
        writeFileSync(file, await fetchBytes(url));
        fetched++;
      } catch (error) {
        failures.push(String(error));
      }
      await sleep(1000);
    }
    if ((index + 1) % 50 === 0) console.log(`progress ${index + 1}/${urls.length}`);
  }

  writeFileSync(path.join(CACHE, 'urls.json'), JSON.stringify(urls, null, 2));
  console.log(`Done: ${fetched} downloaded, ${urls.length - fetched - failures.length} already cached, ${failures.length} failed.`);
  for (const failure of failures) console.log(`  failed: ${failure}`);
}

if (import.meta.main) await crawl();
