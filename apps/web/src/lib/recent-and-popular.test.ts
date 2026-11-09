import { describe, expect, it } from 'vitest';
import { parseScores, windowKeys } from './property-views';
import { recentAndPopular } from './recent-and-popular';

const listing = (code: string) => ({ id: `id-${code}`, code });
// Listed in the string order Sanity returns: 937 before 1170.
const listings = ['937', '936', '1170', '1168', '1100', '0740'].map(listing);
const codes = (views: [string, number][], count = 4) =>
  recentAndPopular(listings, new Map(views.map(([code, total]) => [`id-${code}`, total])), count).map(({ code }) => code);

describe('recentAndPopular', () => {
  it('is the newest listings, by number, without visit data', () => {
    expect(codes([])).toEqual(['1170', '1168', '1100', '937']);
  });

  it('alternates newest and most visited', () => {
    expect(codes([['0740', 50], ['936', 20]])).toEqual(['1170', '0740', '1168', '936']);
  });

  it('does not repeat a listing that is both new and popular', () => {
    expect(codes([['1170', 50], ['936', 20]])).toEqual(['1170', '936', '1168', '1100']);
  });

  it('breaks ties in visits toward the newer listing', () => {
    expect(codes([['936', 5], ['937', 5]], 2)).toEqual(['1170', '937']);
  });

  it('stops when there are fewer listings than slots', () => {
    expect(codes([], 20)).toHaveLength(listings.length);
  });
});

describe('parseScores', () => {
  it('reads the flat member and score list', () => {
    expect(parseScores(['a', '1', 'b', '12'])).toEqual(new Map([['a', 1], ['b', 12]]));
  });

  it('is empty for anything unexpected', () => {
    expect(parseScores(null).size).toBe(0);
  });
});

describe('windowKeys', () => {
  it('covers 30 days ending today', () => {
    const keys = windowKeys(new Date('2026-11-09T12:00:00Z'));
    expect(keys).toHaveLength(30);
    expect(keys[0]).toMatch(/2026-11-09$/);
    expect(keys[29]).toMatch(/2026-10-11$/);
  });
});
