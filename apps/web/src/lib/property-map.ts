import type { PropertyDetail } from '@/content/types';

const STREET_ZOOM = 16;
const NEIGHBORHOOD_ZOOM = 14;

type MapLocation = Pick<PropertyDetail, 'address' | 'cep' | 'neighborhood' | 'city' | 'state'>;

/** Google Maps embed for a listing, searching for the most precise location it has. */
export function propertyMap({ address, cep, neighborhood, city, state }: MapLocation) {
  // Imported addresses often end in a placeholder number ("Avenida Ceará, sn"), which only confuses the search.
  const street = address.replace(/,\s*(?:s\.?\/?n\.?|0+)\s*$/i, '').trim();
  const area = `${neighborhood}, ${city} - ${state}`;
  const place = street ? `${street}, ${area}` : area;
  const query = [place, cep, 'Brasil'].filter(Boolean).join(', ');
  const approximate = !street && !cep;
  const zoom = approximate ? NEIGHBORHOOD_ZOOM : STREET_ZOOM;
  return {
    src: `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&hl=pt-BR&output=embed`,
    place,
    approximate,
  };
}
