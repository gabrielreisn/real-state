import type { PropertySummary } from '@/content/types';
import { plural } from './format';
import { listingsHref } from './listings-url';
import { createSearcher, matchAll, matchCode, matchGroup, normalize, queryWords, type SearchFields, words } from './property-search';

export type SuggestionListing = SearchFields & Pick<PropertySummary, 'href'>;

export type Suggestion = { kind: string; label: string; detail: string; href: string };

const MAX_PLACES = 5;
const MAX_SUGGESTIONS = 8;

/** Only what the suggestions read, so the home page sends the browser no more than that. */
export const suggestionListing = ({ code, href, type, city, neighborhood, condominium, address, excerpt }: SuggestionListing): SuggestionListing => ({
  code,
  href,
  type,
  city,
  neighborhood,
  condominium,
  address,
  excerpt,
});

type Candidate = Suggestion & { order: number; targets: string[]; count: number };

const countLabel = (count: number) => `${count} ${plural(count, 'imóvel', 'imóveis')}`;
const describe = ({ type, neighborhood, city }: SuggestionListing) => `${type} em ${neighborhood}, ${city}`;

/** One suggestion per distinct name. A name with a single listing opens it; several open the search for that name. */
function namedGroups(listings: SuggestionListing[], kind: string, order: number, nameOf: (listing: SuggestionListing) => string | undefined): Candidate[] {
  const groups = new Map<string, { label: string; members: SuggestionListing[] }>();
  for (const listing of listings) {
    const label = nameOf(listing)?.trim();
    if (!label) continue;
    const key = normalize(label);
    const group = groups.get(key) ?? { label, members: [] };
    group.members.push(listing);
    groups.set(key, group);
  }
  return [...groups.values()].map(({ label, members }) => ({
    kind,
    order,
    label,
    targets: words(label),
    count: members.length,
    detail: members.length === 1 ? describe(members[0]) : `${countLabel(members.length)} em ${members[0].neighborhood}, ${members[0].city}`,
    href: members.length === 1 ? members[0].href : listingsHref({ busca: label }),
  }));
}

function countedPlaces(listings: SuggestionListing[], kind: string, order: number, keyOf: (listing: SuggestionListing) => string, build: (first: SuggestionListing) => Pick<Candidate, 'label' | 'href'> & { where?: string }): Candidate[] {
  const counts = new Map<string, { first: SuggestionListing; count: number }>();
  for (const listing of listings) {
    const key = keyOf(listing);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { first: listing, count: 1 });
  }
  return [...counts.values()].map(({ first, count }) => {
    const { label, href, where } = build(first);
    return { kind, order, label, href, targets: words(label), count, detail: where ? `${where} · ${countLabel(count)}` : countLabel(count) };
  });
}

/** The listing a search names outright by its code ("1170", "#1170"), if any. */
export function listingForCode(listings: SuggestionListing[], query: string) {
  const searched = queryWords(query);
  if (searched.length !== 1) return undefined;
  return listings.find((listing) => matchCode(searched[0], listing.code) === 0);
}

/** Prepares the suggestion list once; the returned function runs on every keystroke. */
export function createSuggester(listings: SuggestionListing[]) {
  const search = createSearcher(listings);
  const places = [
    ...namedGroups(listings, 'Condomínio', 1, (listing) => listing.condominium),
    ...namedGroups(listings, 'Endereço', 2, (listing) => listing.address),
    ...countedPlaces(listings, 'Bairro', 3, (listing) => `${listing.city}|${listing.neighborhood}`, ({ city, neighborhood }) => ({
      label: neighborhood,
      where: city,
      href: listingsHref({ cidade: city, bairro: neighborhood }),
    })),
    ...countedPlaces(listings, 'Cidade', 4, (listing) => listing.city, ({ city }) => ({ label: city, href: listingsHref({ cidade: city }) })),
    ...countedPlaces(listings, 'Tipo', 5, (listing) => listing.type, ({ type }) => ({ label: type, href: listingsHref({ tipo: type }) })),
  ];

  return (query: string): Suggestion[] => {
    const searched = queryWords(query);
    if (searched.length === 0) return [];

    const codes: Suggestion[] =
      searched.length === 1
        ? listings
            .filter((listing) => matchCode(searched[0], listing.code) !== null)
            .toSorted((a, b) => matchCode(searched[0], a.code)! - matchCode(searched[0], b.code)! || a.code.localeCompare(b.code))
            .map((listing) => ({ kind: 'Código', label: listing.code, detail: describe(listing), href: listing.href }))
        : [];

    const matched = places.flatMap((place) => {
      const match = matchAll(searched, place.targets);
      return match === null ? [] : [{ place, match, group: matchGroup(match) }];
    });
    const bestGroup = Math.min(...matched.map(({ group }) => group));
    const ranked = matched
      .filter(({ group }) => group === bestGroup)
      .toSorted(
        (a, b) =>
          a.match - b.match ||
          // The closer the whole name is to the search, the better: "Vitória" the city before "Jardim Vitória".
          a.place.targets.length - b.place.targets.length ||
          a.place.order - b.place.order ||
          b.place.count - a.place.count ||
          a.place.label.localeCompare(b.place.label, 'pt-BR'),
      )
      .slice(0, MAX_PLACES)
      .map(({ place: { kind, label, detail, href } }): Suggestion => ({ kind, label, detail, href }));

    // The remaining room shows actual listings, which is also how text-only matches surface.
    const individual = search(query)
      .toSorted((a, b) => Number(b.code) - Number(a.code))
      .map((listing): Suggestion => ({ kind: 'Imóvel', label: `Código ${listing.code}`, detail: describe(listing), href: listing.href }));

    const seen = new Set<string>();
    return [...codes, ...ranked, ...individual]
      .filter(({ href }) => {
        if (seen.has(href)) return false;
        seen.add(href);
        return true;
      })
      .slice(0, MAX_SUGGESTIONS);
  };
}
