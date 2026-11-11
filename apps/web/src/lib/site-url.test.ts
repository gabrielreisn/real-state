import { describe, expect, it } from 'vitest';
import { getSiteUrl } from './site-url';

describe('site URL for metadata', () => {
  it('uses an explicitly configured custom domain', () => {
    expect(getSiteUrl({ SITE_URL: 'https://imoveis.example.com/', VERCEL_PROJECT_PRODUCTION_URL: 'site.vercel.app' }))
      .toBe('https://imoveis.example.com');
  });

  it('points share images at the Vercel production site when SITE_URL is unset', () => {
    const base = getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'real-state-one-smoky.vercel.app', VERCEL_URL: 'preview.vercel.app' });
    expect(new URL('/opengraph-image', base).href).toBe('https://real-state-one-smoky.vercel.app/opengraph-image');
  });

  it('uses the deployment host when no production domain is available', () => {
    expect(getSiteUrl({ VERCEL_URL: 'preview.vercel.app' })).toBe('https://preview.vercel.app');
  });

  it('treats an empty SITE_URL as unconfigured', () => {
    expect(getSiteUrl({ SITE_URL: '', VERCEL_PROJECT_PRODUCTION_URL: 'site.vercel.app' })).toBe('https://site.vercel.app');
  });

  it('uses localhost outside Vercel when no URL is configured', () => {
    expect(getSiteUrl({})).toBe('http://localhost:3000');
  });
});
