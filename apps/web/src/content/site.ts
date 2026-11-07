// Pages outside this rebuild's scope still live on the current site.
const LEGACY_URL = 'https://www.alexnolasco.com.br';

export const legacy = (path: string) => `${LEGACY_URL}${path}`;

export const whatsappLink = (number: string, message?: string) =>
  `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

export const phoneLink = (number: string) => `tel:+${number}`;
