import { describe, expect, it } from 'vitest';
import { propertyWhatsappLink } from './property-whatsapp';

describe('property WhatsApp destination', () => {
  const property = { code: '1170', type: 'Apartamento', neighborhood: 'Praia de Itaparica', city: 'Vila Velha', price: 1530000, condominium: 'Ed. American Towers', href: '/imovel/1170/apartamento' };

  it('preserves the contact number, accented details, price and current site link', () => {
    const url = new URL(propertyWhatsappLink('5527993125983', property, 'https://preview.example.com'));
    expect(url.hostname).toBe('wa.me');
    expect(url.pathname).toBe('/5527993125983');
    const message = url.searchParams.get('text');
    for (const detail of ['1170', 'Apartamento', 'Praia de Itaparica, Vila Velha', 'Ed. American Towers', '1.530.000', 'https://preview.example.com/imovel/1170/apartamento']) expect(message).toContain(detail);
  });

  it('handles city-only listings and prices on request without empty details', () => {
    const url = new URL(propertyWhatsappLink('5527993125983', { ...property, neighborhood: '', condominium: undefined, price: null }, 'https://example.com'));
    const message = url.searchParams.get('text');
    expect(message).toContain('Apartamento em Vila Velha.');
    expect(message).toContain('Preço sob consulta');
    expect(message).not.toContain('undefined');
    expect(message).not.toContain('Condomínio:');
  });
});
