import { stegaClean } from 'next-sanity';
import type { PropertyDetail } from '@/content/types';
import { cepCoordinates, propertyMap } from '@/lib/property-map';

export async function PropertyMap({ property }: { property: PropertyDetail }) {
  const coordinates = property.cep ? await cepCoordinates(property.cep) : null;
  // In preview mode the address carries invisible edit markers, which must not reach the map URL.
  const map = propertyMap({ ...property, address: stegaClean(property.address) }, coordinates);

  return (
    <section aria-labelledby="localizacao-titulo">
      <h2 id="localizacao-titulo" className="border-b-2 border-brand pb-2 text-2xl font-bold">
        Localização do Imóvel
      </h2>
      <iframe
        title={`Mapa: ${map.place}`}
        src={map.src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="mt-5 aspect-[16/10] w-full border-0 bg-mist"
      />
      <p className="mt-2 text-sm text-slate">
        {map.approximate ? 'Localização aproximada: ' : null}
        {map.place}
      </p>
    </section>
  );
}
