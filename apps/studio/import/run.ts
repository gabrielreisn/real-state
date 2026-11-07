/**
 * Step 2 of the ImobiBrasil import: parses the cached listing pages (see crawl.ts) and loads them
 * into Sanity.
 *
 *   node import/run.ts                                 # dry run: report only, writes nothing
 *   node import/run.ts --write                         # into the "development" dataset
 *   node import/run.ts --write --dataset production
 *
 * Idempotent. Documents use the listing code as ID (property-<code>). Facts that come from the
 * old site (price, rooms, areas, fees, address…) are overwritten on every run; editorial content
 * (cover, gallery, description, features) is only filled in when missing, so changes made in
 * Studio survive a re-run. Photos are uploaded once and remembered in .cache/assets.json.
 * Needs SANITY_API_WRITE_TOKEN (an Editor token) in the repo-root .env for --write.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { type ParsedListing, parseListing } from './parse.ts';

const CACHE = path.join(import.meta.dirname, '.cache');
const PAGES = path.join(CACHE, 'pages');
const ASSETS_FILE = path.join(CACHE, 'assets.json');
const USER_AGENT = 'alexnolasco-site-migration (owner-authorized)';

const args = process.argv.slice(2);
const write = args.includes('--write');
const dataset = args.includes('--dataset') ? args[args.indexOf('--dataset') + 1] : 'development';

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Title-cases names the old site stores inconsistently ("Enseada Do Suá" → "Enseada do Suá"). */
const tidyName = (name: string) =>
  name
    .toLowerCase()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase())
    .replace(/ (Da|De|Do|Das|Dos|E)(?= )/g, (word) => word.toLowerCase());

// ---------------------------------------------------------------------------------------------
// Parse

type Listing = ParsedListing & { disclaimers: string[]; body: string; excerpt?: string };

/** Lines wrapped in *** are standard notices; they render separately from the description. */
function splitDescription(description: string) {
  const disclaimers: string[] = [];
  const body = description
    .replace(/\*{2,}\s*([^*]+?)\s*\*{2,}/g, (_, notice: string) => {
      disclaimers.push(notice.trim());
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { disclaimers: [...new Set(disclaimers)], body };
}

/** First real sentence(s) of the description, without emoji or shouting, for the featured cards. */
function excerptOf(body: string) {
  const text = body
    .replace(/\p{Extended_Pictographic}|️/gu, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .join(' ');
  if (!text) return undefined;
  const sentenceCase = text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text;
  return sentenceCase.length <= 200 ? sentenceCase : `${sentenceCase.slice(0, 200).replace(/\s+\S*$/, '')}…`;
}

function loadListings() {
  const urls: string[] = JSON.parse(readFileSync(path.join(CACHE, 'urls.json'), 'utf8'));
  const byId = new Map(urls.map((url) => [url.match(/\/imovel\/(\d+)\//)![1], url]));
  const listings: Listing[] = [];
  const failures: string[] = [];
  for (const file of readdirSync(PAGES).filter((name) => name.endsWith('.html'))) {
    const legacyId = file.replace('.html', '');
    try {
      const parsed = parseListing(readFileSync(path.join(PAGES, file)), byId.get(legacyId) ?? `https://www.alexnolasco.com.br/imovel/${legacyId}/`);
      const { disclaimers, body } = splitDescription(parsed.description);
      listings.push({ ...parsed, neighborhood: tidyName(parsed.neighborhood), disclaimers, body, excerpt: excerptOf(body) });
    } catch (error) {
      failures.push(`${legacyId}: ${String(error)}`);
    }
  }
  // A few listings were saved without a city: borrow it from other listings in the same
  // neighborhood when that is unambiguous.
  const inferred: string[] = [];
  for (const listing of listings.filter((l) => !l.city && l.neighborhood)) {
    const cities = new Set(listings.filter((l) => l.city && l.neighborhood === listing.neighborhood).map((l) => l.city));
    if (cities.size === 1) {
      listing.city = [...cities][0];
      listing.title = `${listing.title}, ${listing.city} / ${listing.state}`;
      inferred.push(`${listing.code} → ${listing.city} (from ${listing.neighborhood})`);
    }
  }
  return { listings: listings.sort((a, b) => Number(b.code) - Number(a.code)), failures, inferred };
}

// ---------------------------------------------------------------------------------------------
// Report

function report(listings: Listing[], failures: string[], inferred: string[]) {
  const count = (values: string[]) =>
    Object.entries(values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1])
      .map(([value, n]) => `${value} (${n})`)
      .join(', ');
  const codes = listings.map((listing) => listing.code);
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  const isLand = (listing: Listing) => /terreno|s[ií]tio|ch[aá]cara|fazenda/i.test(listing.type);
  const issues: [string, Listing[]][] = [
    ['no price ("Consulte")', listings.filter((l) => l.price === null)],
    ['no photos', listings.filter((l) => l.images.length === 0)],
    ['no neighborhood', listings.filter((l) => !l.neighborhood)],
    ['no city', listings.filter((l) => !l.city)],
    ['no description', listings.filter((l) => !l.body)],
    ['area under 15 m² (likely a typo)', listings.filter((l) => !isLand(l) && l.area !== undefined && l.area < 15)],
    ['price under R$ 50 mil (likely a typo)', listings.filter((l) => l.price !== null && l.price < 50000)],
  ];

  console.log(`\nParsed ${listings.length} listings (${failures.length} failed).`);
  for (const failure of failures) console.log(`  FAILED ${failure}`);
  console.log(`Types: ${count(listings.map((l) => l.type))}`);
  console.log(`Cities: ${count(listings.map((l) => l.city))}`);
  console.log(`Neighborhoods: ${new Set(listings.map((l) => `${l.city}|${l.neighborhood}`)).size}`);
  const photos = listings.reduce((sum, l) => sum + l.images.length, 0);
  console.log(`Photos: ${photos} (${(photos / listings.length).toFixed(1)} per listing, max ${Math.max(...listings.map((l) => l.images.length))})`);
  if (duplicates.length) console.log(`DUPLICATE CODES: ${[...new Set(duplicates)].join(', ')}`);
  if (inferred.length) console.log(`City missing on the old site, inferred from the neighborhood: ${inferred.join('; ')}`);
  console.log('\nThings to review in Studio (copied as-is from the old site):');
  for (const [label, matches] of issues) {
    console.log(`  ${label}: ${matches.length}${matches.length ? ` — codes ${matches.map((l) => l.code).join(', ')}` : ''}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Write

function sanityClient() {
  const envFile = path.join(import.meta.dirname, '../../../.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error('Set SANITY_API_WRITE_TOKEN (an Editor token) in the repo-root .env.');
  return createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '1ai1aq1e',
    dataset,
    apiVersion: '2025-02-19',
    token,
    useCdn: false,
  });
}

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: limit }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
  }));
}

async function uploadPhotos(client: SanityClient, listings: Listing[]) {
  const assets: Record<string, string> = existsSync(ASSETS_FILE) ? JSON.parse(readFileSync(ASSETS_FILE, 'utf8')) : {};
  const pending = [...new Set(listings.flatMap((listing) => listing.images))].filter((url) => !assets[url]);
  console.log(`Photos: ${pending.length} to upload, ${Object.keys(assets).length} already uploaded.`);
  let done = 0;
  const failed: string[] = [];
  await mapLimit(pending, 4, async (url) => {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) throw new Error(`${response.status}`);
      const asset = await client.assets.upload('image', Buffer.from(await response.arrayBuffer()), {
        filename: url.split('/').pop(),
        source: { name: 'imobibrasil', id: url, url },
      });
      assets[url] = asset._id;
    } catch (error) {
      failed.push(`${url} (${String(error)})`);
    }
    done++;
    if (done % 100 === 0) {
      writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2));
      console.log(`  ${done}/${pending.length} photos`);
    }
  });
  writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2));
  if (failed.length) console.log(`  ${failed.length} photos failed (re-run to retry):\n    ${failed.slice(0, 10).join('\n    ')}`);
  return assets;
}

async function writeListings(listings: Listing[]) {
  const client = sanityClient();
  console.log(`\nWriting to project ${client.config().projectId}, dataset "${dataset}".`);

  // Reuse neighborhoods that already exist (matched by city and name) so nothing is duplicated.
  const existing = await client.fetch<{ _id: string; name: string; city: string }[]>(`*[_type == "neighborhood"]{ _id, name, city }`);
  const neighborhoodIds = new Map(existing.map((n) => [`${n.city}|${n.name}`.toLowerCase(), n._id]));
  const neighborhoodTransaction = client.transaction();
  for (const listing of listings) {
    const key = `${listing.city}|${listing.neighborhood}`.toLowerCase();
    if (!listing.neighborhood || neighborhoodIds.has(key)) continue;
    const id = `neighborhood-${slugify(listing.city)}-${slugify(listing.neighborhood)}`;
    neighborhoodIds.set(key, id);
    neighborhoodTransaction.createIfNotExists({
      _id: id,
      _type: 'neighborhood',
      name: listing.neighborhood,
      slug: { _type: 'slug', current: slugify(listing.neighborhood) },
      city: listing.city,
      state: listing.state,
    });
  }
  const created = await neighborhoodTransaction.commit();
  console.log(`Neighborhoods: ${created.results.length} created, ${existing.length} already existed.`);

  const assets = await uploadPhotos(client, listings);

  let saved = 0;
  for (let start = 0; start < listings.length; start += 20) {
    const transaction = client.transaction();
    for (const listing of listings.slice(start, start + 20)) {
      const id = `property-${listing.code}`;
      const photos = listing.images.filter((url) => assets[url]);
      const alt = (index: number) => `${listing.type} em ${listing.neighborhood || listing.city}, foto ${index + 1}`;
      const image = (url: string, index: number, key?: string) => ({
        _type: 'image',
        ...(key ? { _key: key } : {}),
        asset: { _type: 'reference', _ref: assets[url] },
        alt: alt(index),
      });
      const neighborhood = neighborhoodIds.get(`${listing.city}|${listing.neighborhood}`.toLowerCase());

      const facts = Object.fromEntries(
        Object.entries({
          code: listing.code,
          legacyId: listing.legacyId,
          slug: { _type: 'slug', current: listing.slug },
          title: listing.title,
          summary: listing.summary,
          type: listing.type,
          purpose: listing.purpose,
          price: listing.price ?? undefined,
          neighborhood: neighborhood ? { _type: 'reference', _ref: neighborhood } : undefined,
          address: listing.address,
          condominium: listing.condominium,
          inCondominium: listing.inCondominium,
          condoFee: listing.condoFee,
          iptu: listing.iptu,
          area: listing.area,
          builtArea: listing.builtArea,
          landArea: listing.landArea,
          bedrooms: listing.bedrooms,
          suites: listing.suites,
          bathrooms: listing.bathrooms,
          parking: listing.parking,
          livingRooms: listing.livingRooms,
        }).filter(([, value]) => value !== undefined),
      );
      const content = Object.fromEntries(
        Object.entries({
          coverImage: photos[0] ? image(photos[0], 0) : undefined,
          gallery: photos.length ? photos.map((url, index) => image(url, index, `photo-${index + 1}`)) : undefined,
          excerpt: listing.excerpt,
          description: listing.body || listing.disclaimers.length ? { body: listing.body, disclaimers: listing.disclaimers } : undefined,
          featureGroups: listing.featureGroups.length
            ? listing.featureGroups.map((group, index) => ({ _type: 'featureGroup', _key: `group-${index + 1}`, ...group }))
            : undefined,
        }).filter(([, value]) => value !== undefined),
      );

      transaction.createIfNotExists({ _id: id, _type: 'property', code: listing.code });
      transaction.patch(id, (patch) => {
        let next = patch.set(facts).setIfMissing(content).unset(['externalUrl']);
        if (listing.price === null) next = next.unset(['price']);
        return next;
      });
    }
    await transaction.commit({ visibility: 'async' });
    saved += Math.min(20, listings.length - start);
    console.log(`  ${saved}/${listings.length} listings saved`);
  }
  console.log('Done.');
}

const { listings, failures, inferred } = loadListings();
report(listings, failures, inferred);
if (write) await writeListings(listings);
else console.log('\nDry run: nothing was written. Re-run with --write to import.');
