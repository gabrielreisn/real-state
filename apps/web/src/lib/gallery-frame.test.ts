import { describe, expect, it } from 'vitest';
import { galleryFrameRatio } from './gallery-frame';

const wide = { width: 1400, height: 630 };
const classic = { width: 1280, height: 960 };
const tall = { width: 405, height: 900 };

describe('galleryFrameRatio', () => {
  it('matches the typical landscape photo and ignores portraits', () => {
    expect(galleryFrameRatio([wide, tall, wide, tall, tall, classic, wide])).toBeCloseTo(1400 / 630);
  });

  it('keeps the frame from getting too tall or too thin', () => {
    expect(galleryFrameRatio([classic])).toBe(3 / 2);
    expect(galleryFrameRatio([{ width: 3000, height: 1000 }])).toBe(2.4);
  });

  it('falls back when there is no landscape photo or the sizes are unknown', () => {
    expect(galleryFrameRatio([tall, tall])).toBe(3 / 2);
    expect(galleryFrameRatio([{}])).toBe(3 / 2);
    expect(galleryFrameRatio([])).toBe(3 / 2);
  });
});
