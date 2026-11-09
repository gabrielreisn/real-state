import { afterEach, describe, expect, it, vi } from 'vitest';
import { cepCoordinates, normalizeCep, propertyMap } from '@/lib/property-map';

const location = { address: '', cep: '', neighborhood: 'Praia do Canto', city: 'Vitória', state: 'ES' };
const query = (src: string) => new URL(src).searchParams.get('q');
const zoom = (src: string) => new URL(src).searchParams.get('z');

afterEach(() => vi.unstubAllGlobals());

describe('normalizeCep', () => {
  it('accepts CEPs with or without the hyphen', () => {
    expect(normalizeCep('29055-620')).toBe('29055620');
    expect(normalizeCep('29055620')).toBe('29055620');
  });

  it('rejects anything that is not 8 digits', () => {
    expect(normalizeCep('2905562')).toBeNull();
    expect(normalizeCep('')).toBeNull();
  });
});

describe('cepCoordinates', () => {
  const respondWith = (body: unknown, status = 200) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

  it('parses the coordinates of a known CEP', async () => {
    respondWith({ lat: '-20.2951151', lng: '-40.2925067' });
    await expect(cepCoordinates('29055-620')).resolves.toEqual({ lat: -20.2951151, lng: -40.2925067 });
    expect(fetch).toHaveBeenCalledWith('https://cep.awesomeapi.com.br/json/29055620', expect.anything());
  });

  it('returns null for an unknown CEP', async () => {
    respondWith({ code: 'not_found' }, 404);
    await expect(cepCoordinates('29999-999')).resolves.toBeNull();
  });

  it('returns null when the CEP has no coordinates', async () => {
    respondWith({ lat: '', lng: '' });
    await expect(cepCoordinates('29055-620')).resolves.toBeNull();
  });

  it('returns null when the lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    await expect(cepCoordinates('29055-620')).resolves.toBeNull();
  });

  it('does not call the service for a malformed CEP', async () => {
    respondWith({});
    await expect(cepCoordinates('123')).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('propertyMap', () => {
  it('pins the coordinates when the CEP resolved', () => {
    const map = propertyMap({ ...location, address: 'Rua João da Cruz, 10', cep: '29055-620' }, { lat: -20.29, lng: -40.29 });
    expect(query(map.src)).toBe('-20.29,-40.29');
    expect(zoom(map.src)).toBe('16');
    expect(map.place).toBe('Rua João da Cruz, 10, Praia do Canto, Vitória - ES');
    expect(map.approximate).toBe(false);
  });

  it('searches the written address when there are no coordinates', () => {
    const map = propertyMap({ ...location, address: 'Rua João da Cruz, 10' }, null);
    expect(query(map.src)).toBe('Rua João da Cruz, 10, Praia do Canto, Vitória - ES, Brasil');
    expect(map.approximate).toBe(false);
  });

  it('still uses the CEP as text when its lookup failed', () => {
    const map = propertyMap({ ...location, cep: '29055-620' }, null);
    expect(query(map.src)).toBe('Praia do Canto, Vitória - ES, 29055-620, Brasil');
    expect(zoom(map.src)).toBe('16');
    expect(map.approximate).toBe(false);
  });

  it('falls back to a wider view of the neighborhood', () => {
    const map = propertyMap(location, null);
    expect(query(map.src)).toBe('Praia do Canto, Vitória - ES, Brasil');
    expect(zoom(map.src)).toBe('14');
    expect(map.approximate).toBe(true);
  });

  it.each(['Avenida Ceará, sn', 'Avenida Ceará, s/n', 'Avenida Ceará, S/N', 'Avenida Ceará, 00'])('drops the placeholder number in "%s"', (address) => {
    expect(propertyMap({ ...location, address }, null).place).toBe('Avenida Ceará, Praia do Canto, Vitória - ES');
  });

  it('keeps real street numbers', () => {
    expect(propertyMap({ ...location, address: 'Rua Q, 540' }, null).place).toBe('Rua Q, 540, Praia do Canto, Vitória - ES');
  });
});
