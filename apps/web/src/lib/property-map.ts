import type { PropertyDetail } from '@/content/types';

export type Coordinates = { lat: number; lng: number };

const CEP_CACHE_SECONDS = 60 * 60 * 24 * 30;
const STREET_ZOOM = 16;
const NEIGHBORHOOD_ZOOM = 14;

export function normalizeCep(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 8 ? digits : null;
}

/**
 * The CEP's coordinates, or null when it is unknown or the lookup fails, so the map can fall back
 * to the written address. AwesomeAPI is used because BrasilAPI answers with a point near the city
 * center for many Grande Vitória CEPs.
 */
export async function cepCoordinates(cep: string): Promise<Coordinates | null> {
  const digits = normalizeCep(cep);
  if (!digits) return null;
  try {
    const response = await fetch(`https://cep.awesomeapi.com.br/json/${digits}`, {
      next: { revalidate: CEP_CACHE_SECONDS },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const { lat, lng } = (await response.json()) as { lat?: string; lng?: string };
    if (!lat || !lng) return null;
    const coordinates = { lat: Number(lat), lng: Number(lng) };
    return Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng) ? coordinates : null;
  } catch {
    return null;
  }
}

type MapLocation = Pick<PropertyDetail, 'address' | 'cep' | 'neighborhood' | 'city' | 'state'>;

/** Google Maps embed for a listing: its CEP's coordinates when known, otherwise the most precise text available. */
export function propertyMap({ address, cep, neighborhood, city, state }: MapLocation, coordinates: Coordinates | null) {
  // Imported addresses often end in a placeholder number ("Avenida Ceará, sn"), which only confuses the search.
  const street = address.replace(/,\s*(?:s\.?\/?n\.?|0+)\s*$/i, '').trim();
  const area = `${neighborhood}, ${city} - ${state}`;
  const place = street ? `${street}, ${area}` : area;
  const query = coordinates ? `${coordinates.lat},${coordinates.lng}` : [place, cep, 'Brasil'].filter(Boolean).join(', ');
  const approximate = !coordinates && !street && !cep;
  const zoom = approximate ? NEIGHBORHOOD_ZOOM : STREET_ZOOM;
  return {
    src: `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&hl=pt-BR&output=embed`,
    place,
    approximate,
  };
}
