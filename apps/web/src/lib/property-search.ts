import type { PropertySummary } from '@/content/types';

/** The text a listing can be found by. */
export type SearchFields = Pick<PropertySummary, 'code' | 'type' | 'city' | 'neighborhood'> &
  Partial<Pick<PropertySummary, 'condominium' | 'address' | 'excerpt'>>;

/** How well a word matched, best first. Anything from TYPO on only counts when nothing better matched. */
export const Match = { EXACT: 0, PREFIX: 1, INSIDE: 2, TYPO: 3, LISTING_TEXT: 4 } as const;

export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const words = (text: string | undefined) => (text ? normalize(text).split(' ').filter(Boolean) : []);

// Words people add that say nothing about which listing they mean: "rua", "edifício", "código 1170".
const FILLER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'rua', 'r', 'av', 'avenida', 'edificio', 'ed', 'condominio', 'cond', 'residencial', 'bairro', 'codigo', 'cod', 'imovel', 'ref']);

/** The words of a search that identify something; a search made only of filler words keeps them. */
export function queryWords(query: string) {
  const all = words(query);
  const meaningful = all.filter((word) => !FILLER.has(word));
  return meaningful.length > 0 ? meaningful : all;
}

/** Splits text around the searched words, ignoring accents and case, so the matching parts can be emphasized. */
export function highlightParts(text: string, query: string) {
  // One character at a time, so positions still line up with the original text.
  const plain = [...text].map((char) => char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().padEnd(1).slice(0, 1)).join('');
  const marked = new Array<boolean>(plain.length).fill(false);
  for (const word of queryWords(query)) {
    for (let at = plain.indexOf(word); at !== -1; at = plain.indexOf(word, at + word.length)) marked.fill(true, at, at + word.length);
  }
  const chars = [...text];
  const parts: { text: string; match: boolean }[] = [];
  chars.forEach((char, index) => {
    const last = parts.at(-1);
    if (last && last.match === marked[index]) last.text += char;
    else parts.push({ text: char, match: marked[index] });
  });
  return parts;
}

/** Edit distance counting a swap of neighboring letters as one edit, which is how most typos happen. */
function editDistance(a: string, b: string) {
  let beforePrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) current[j] = Math.min(current[j], beforePrevious[j - 2] + 1);
    }
    beforePrevious = previous;
    previous = current;
  }
  return previous[b.length];
}

function isTypoOf(word: string, target: string) {
  // Short words and numbers would match too much; a wrong first letter is rarely a typo ("serra" is not "terra").
  if (word.length < 4 || /\d/.test(word) || word[0] !== target[0]) return false;
  const allowed = word.length >= 8 ? 2 : 1;
  // Against the start of the target too, for a word still being typed.
  return editDistance(word, target) <= allowed || editDistance(word, target.slice(0, word.length)) <= allowed;
}

/** The best match of one searched word among a field's words, or null. */
export function matchWord(word: string, targets: string[]): number | null {
  let best: number | null = null;
  for (const target of targets) {
    let match: number | null = null;
    if (target === word) match = Match.EXACT;
    else if (target.startsWith(word)) match = Match.PREFIX;
    else if (word.length >= 3 && target.includes(word)) match = Match.INSIDE;
    else if (isTypoOf(word, target)) match = Match.TYPO;
    if (match !== null && (best === null || match < best)) best = match;
  }
  return best;
}

/** The worst match across a search's words, or null when any word is missing. */
export function matchAll(query: string[], targets: string[]): number | null {
  let worst = 0;
  for (const word of query) {
    const match = matchWord(word, targets);
    if (match === null) return null;
    worst = Math.max(worst, match);
  }
  return worst;
}

// Codes are stored both as "0740" and "937"; people type them without the leading zero.
const withoutLeadingZeros = (digits: string) => digits.replace(/^0+(?=\d)/, '');

/** How a searched word matches a listing code, or null. A code must be typed from its first digit. */
export function matchCode(word: string, code: string): number | null {
  if (!/^\d+$/.test(word)) return null;
  const typed = withoutLeadingZeros(word);
  const target = withoutLeadingZeros(code);
  if (typed === target) return Match.EXACT;
  return typed.length >= 2 && target.startsWith(typed) ? Match.PREFIX : null;
}

/** Results are shown from the best group that has any: direct matches, else typos, else listing text. */
export const matchGroup = (match: number) => (match <= Match.INSIDE ? 0 : match === Match.TYPO ? 1 : 2);

/**
 * Prepares listings for repeated searches. Every searched word must be found somewhere in the
 * listing. Free text is the last resort and needs the word itself, because long descriptions
 * would otherwise match almost any typo.
 */
export function createSearcher<T extends SearchFields>(properties: T[]) {
  const indexed = properties.map((property) => ({
    property,
    fields: [property.condominium, property.address, property.neighborhood, property.city, property.type].flatMap(words),
    text: words(property.excerpt),
  }));

  return (query: string): T[] => {
    const searched = queryWords(query);
    if (searched.length === 0) return properties;

    const scored = indexed.flatMap(({ property, fields, text }) => {
      let worst = 0;
      for (const word of searched) {
        const direct = matchCode(word, property.code) ?? matchWord(word, fields);
        const inText = word.length >= 3 && text.some((target) => target.startsWith(word));
        if (direct === null && !inText) return [];
        worst = Math.max(worst, direct ?? Match.LISTING_TEXT);
      }
      return [{ property, group: matchGroup(worst) }];
    });
    const best = Math.min(...scored.map(({ group }) => group));
    return scored.filter(({ group }) => group === best).map(({ property }) => property);
  };
}
