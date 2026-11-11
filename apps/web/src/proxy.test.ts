import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isPropertyUnavailable } from '@/content/availability';
import { proxy } from './proxy';

vi.mock('@/content/availability', () => ({ isPropertyUnavailable: vi.fn() }));

describe('unavailable property HTTP response', () => {
  const request = () => new NextRequest('https://example.com/imovel/TESTE-VIDEO/teste-galeria');
  it('returns a real uncached 404 before streaming the page', async () => {
    vi.mocked(isPropertyUnavailable).mockResolvedValueOnce(true);
    const response = await proxy(request());
    expect(response.status).toBe(404);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toContain('Imóvel indisponível');
    expect(isPropertyUnavailable).toHaveBeenCalledWith('TESTE-VIDEO');
  });
  it('lets available and legacy listings continue to the property page', async () => {
    vi.mocked(isPropertyUnavailable).mockResolvedValueOnce(false);
    expect((await proxy(request())).headers.get('x-middleware-next')).toBe('1');
  });
});
