import { describe, expect, it } from 'vitest';
import loader from './sanity-image-loader';
import { withImageParams } from './sanity/url';

const src = 'https://cdn.sanity.io/images/1ai1aq1e/development/abc123-1400x630.jpg';

describe('sanityImageLoader', () => {
  it('asks the Sanity CDN for the right width, quality and a modern format', () => {
    const url = new URL(loader({ src, width: 640, quality: 85 }));
    expect(Object.fromEntries(url.searchParams)).toEqual({ w: '640', q: '85', auto: 'format', fit: 'max' });
  });

  it('defaults to quality 75', () => {
    expect(new URL(loader({ src, width: 320 })).searchParams.get('q')).toBe('75');
  });

  it("keeps an editor's crop already in the URL", () => {
    const url = new URL(loader({ src: `${src}?rect=10,20,300,200`, width: 640 }));
    expect(url.searchParams.get('rect')).toBe('10,20,300,200');
    expect(new URL(withImageParams(`${src}?rect=1,2,3,4`, { w: 1200 })).searchParams.get('rect')).toBe('1,2,3,4');
  });
});
