const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatPrice = (price: number | null) => (price === null ? 'Preço sob consulta' : currency.format(price));

/** "R$ 750 mil", "R$ 1,5 milhão", "R$ 2 milhões". */
export function formatPriceShort(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `R$ ${decimal.format(millions)} ${millions < 2 ? 'milhão' : 'milhões'}`;
  }
  return `R$ ${decimal.format(value / 1000)} mil`;
}

export const plural = (count: number, singular: string, pluralForm: string) => (count === 1 ? singular : pluralForm);

/** "Jardim Camburi, Vitória", or only the city for a listing without a neighborhood. */
export const placeName = ({ neighborhood, city }: { neighborhood: string; city: string }) => [neighborhood, city].filter(Boolean).join(', ');
