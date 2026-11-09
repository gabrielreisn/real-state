import { describe, expect, it } from 'vitest';
import { propertyMap } from '@/lib/property-map';

const location = { address: '', cep: '', neighborhood: 'Praia do Canto', city: 'Vitória', state: 'ES' };
const query = (src: string) => new URL(src).searchParams.get('q');
const zoom = (src: string) => new URL(src).searchParams.get('z');

describe('propertyMap', () => {
  it('searches the written address together with the CEP', () => {
    const map = propertyMap({ ...location, address: 'Rua João da Cruz, 10', cep: '29055-620' });
    expect(query(map.src)).toBe('Rua João da Cruz, 10, Praia do Canto, Vitória - ES, 29055-620, Brasil');
    expect(zoom(map.src)).toBe('16');
    expect(map.place).toBe('Rua João da Cruz, 10, Praia do Canto, Vitória - ES');
    expect(map.approximate).toBe(false);
  });

  it('searches the written address when there is no CEP', () => {
    const map = propertyMap({ ...location, address: 'Rua João da Cruz, 10' });
    expect(query(map.src)).toBe('Rua João da Cruz, 10, Praia do Canto, Vitória - ES, Brasil');
    expect(map.approximate).toBe(false);
  });

  it('uses the CEP when there is no address', () => {
    const map = propertyMap({ ...location, cep: '29055-620' });
    expect(query(map.src)).toBe('Praia do Canto, Vitória - ES, 29055-620, Brasil');
    expect(zoom(map.src)).toBe('16');
    expect(map.approximate).toBe(false);
  });

  it('falls back to a wider view of the neighborhood', () => {
    const map = propertyMap(location);
    expect(query(map.src)).toBe('Praia do Canto, Vitória - ES, Brasil');
    expect(zoom(map.src)).toBe('14');
    expect(map.approximate).toBe(true);
  });

  it.each(['Avenida Ceará, sn', 'Avenida Ceará, s/n', 'Avenida Ceará, S/N', 'Avenida Ceará, 00'])('drops the placeholder number in "%s"', (address) => {
    expect(propertyMap({ ...location, address }).place).toBe('Avenida Ceará, Praia do Canto, Vitória - ES');
  });

  it('keeps real street numbers', () => {
    expect(propertyMap({ ...location, address: 'Rua Q, 540' }).place).toBe('Rua Q, 540, Praia do Canto, Vitória - ES');
  });
});
