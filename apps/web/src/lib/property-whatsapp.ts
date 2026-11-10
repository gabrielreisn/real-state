import type { PropertySummary } from '@/content/types';
import { whatsappLink } from '@/content/site';
import { formatPrice, placeName } from './format';

type ContactProperty = Pick<PropertySummary, 'code' | 'type' | 'neighborhood' | 'city' | 'price' | 'href' | 'condominium'>;

/** One destination for the mobile button and desktop QR, with enough context to identify the listing. */
export function propertyWhatsappLink(number: string, property: ContactProperty, siteUrl: string) {
  const lines = [
    `Olá! Tenho interesse no imóvel ${property.code}: ${property.type} em ${placeName(property)}.`,
    ...(property.condominium ? [`Condomínio: ${property.condominium}.`] : []),
    `${formatPrice(property.price)}. Gostaria de mais informações e de agendar uma visita.`,
    new URL(property.href, siteUrl).href,
  ];
  return whatsappLink(number, lines.join('\n'));
}
