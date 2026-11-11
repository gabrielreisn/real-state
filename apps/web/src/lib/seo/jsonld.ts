/**
 * schema.org structured data. Every page carries the site-wide graph (the business, Alex and the
 * website, linked by @id) and adds its own nodes that point back to it.
 */
import { placeName } from '@/lib/format';
import type { Neighborhood, Page, PropertyDetail, PropertySummary, SiteSettings } from '@/content/types';
import { formatPriceShort } from '@/lib/format';

type Node = Record<string, unknown>;

export function siteIds(siteUrl: string) {
  return {
    organization: `${siteUrl}/#organization`,
    person: `${siteUrl}/#alex-nolasco`,
    website: `${siteUrl}/#website`,
  };
}

const absolute = (siteUrl: string, href: string) => (href.startsWith('http') ? href : `${siteUrl}${href}`);

/** "5527993125983" → "+55 27 99312-5983" */
export function internationalPhone(whatsapp: string) {
  const match = whatsapp.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `+${match[1]} ${match[2]} ${match[3]}-${match[4]}` : `+${whatsapp}`;
}

function postalAddress(site: SiteSettings): Node {
  return {
    '@type': 'PostalAddress',
    streetAddress: site.street,
    addressLocality: site.addressLocality,
    addressRegion: site.addressRegion,
    postalCode: site.postalCode,
    addressCountry: 'BR',
  };
}

export function siteGraph({
  siteUrl,
  site,
  cities,
  priceRange,
}: {
  siteUrl: string;
  site: SiteSettings;
  cities: string[];
  priceRange?: [number, number];
}): Node {
  const ids = siteIds(siteUrl);
  const telephone = internationalPhone(site.whatsapp);
  const address = [site.street, site.district, site.postalCode].filter(Boolean).join(', ');

  const organization: Node = {
    '@type': 'RealEstateAgent',
    '@id': ids.organization,
    name: site.name,
    alternateName: site.brandName,
    description: `${site.role} em ${site.addressLocality ?? 'Vitória'} - ${site.addressRegion ?? 'ES'}: compra e venda de imóveis residenciais, comerciais e rurais na Grande Vitória.`,
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/icon`, width: 512, height: 512 },
    image: `${siteUrl}/opengraph-image`,
    telephone,
    email: site.email,
    address: postalAddress(site),
    hasMap: `https://www.google.com/maps?q=${encodeURIComponent(address)}`,
    openingHoursSpecification: site.openingHours.map((entry) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: entry.days.map((day) => `https://schema.org/${day}`),
      opens: entry.opens,
      closes: entry.closes,
    })),
    areaServed: cities.map((city) => ({ '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: 'Espírito Santo' } })),
    priceRange: priceRange ? `${formatPriceShort(priceRange[0])} – ${formatPriceShort(priceRange[1])}` : undefined,
    currenciesAccepted: 'BRL',
    knowsLanguage: 'pt-BR',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone,
      email: site.email,
      contactType: 'sales',
      areaServed: 'BR',
      availableLanguage: ['Portuguese'],
    },
    founder: { '@id': ids.person },
    employee: { '@id': ids.person },
    sameAs: site.sameAs.length ? site.sameAs : undefined,
  };

  const person: Node = {
    '@type': 'Person',
    '@id': ids.person,
    name: site.name,
    alternateName: site.brandName,
    jobTitle: site.role,
    worksFor: { '@id': ids.organization },
    telephone,
    email: site.email,
    url: `${siteUrl}/sobre`,
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Registro profissional',
      name: `CRECI-ES ${site.creci}`,
      identifier: site.creci,
      recognizedBy: { '@type': 'Organization', name: 'Conselho Regional de Corretores de Imóveis do Espírito Santo (CRECI-ES)' },
    },
  };

  const website: Node = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: siteUrl,
    name: `${site.brandName} Imóveis`,
    inLanguage: 'pt-BR',
    publisher: { '@id': ids.organization },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/imoveis?codigo={codigo}` },
      'query-input': 'required name=codigo',
    },
  };

  return { '@context': 'https://schema.org', '@graph': [organization, person, website] };
}

export function breadcrumbList(siteUrl: string, items: { label: string; href: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absolute(siteUrl, item.href),
    })),
  };
}

function listItems(siteUrl: string, properties: PropertySummary[], offset = 0) {
  return properties.map((property, index) => ({
    '@type': 'ListItem',
    position: offset + index + 1,
    url: absolute(siteUrl, property.href),
    name: `${property.type} em ${placeName(property)}`,
    image: property.image.src,
  }));
}

/** Residential types map to schema.org Accommodation types; land and commercial stay generic places. */
function residenceType(type: string) {
  if (/apartamento|cobertura|prontos para morar/i.test(type)) return 'Apartment';
  if (/casa(?! comercial)|sobrado/i.test(type)) return 'SingleFamilyResidence';
  return 'Place';
}

export function propertyGraph({
  siteUrl,
  property,
  breadcrumbs,
}: {
  siteUrl: string;
  property: PropertyDetail;
  breadcrumbs: { label: string; href: string }[];
}): Node {
  const ids = siteIds(siteUrl);
  const url = absolute(siteUrl, property.href);
  const type = residenceType(property.type);
  const isAccommodation = type !== 'Place';
  const amenities = property.features.flatMap((group) => group.items);
  const images = property.gallery.filter((media) => media.kind !== 'video').slice(0, 10).map((image) => image.src);
  const description = property.excerpt || property.summary || property.description.body.slice(0, 300);

  const place: Node = {
    '@type': type,
    '@id': `${url}#imovel`,
    name: `${property.type} em ${placeName(property)}`,
    description,
    image: images,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || undefined,
      addressLocality: property.city,
      addressRegion: property.state,
      addressCountry: 'BR',
    },
    containedInPlace: {
      '@type': 'Place',
      name: `${placeName(property)} - ${property.state}`,
      address: { '@type': 'PostalAddress', addressLocality: property.city, addressRegion: property.state, addressCountry: 'BR' },
    },
    ...(isAccommodation
      ? {
          floorSize: property.area ? { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK', unitText: 'm²' } : undefined,
          numberOfRooms: property.bedrooms,
          numberOfBedrooms: property.bedrooms,
          numberOfBathroomsTotal: property.bathrooms,
          petsAllowed: amenities.some((item) => /pet/i.test(item)) || undefined,
          amenityFeature: amenities.length
            ? amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true }))
            : undefined,
        }
      : {}),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Código do imóvel', value: property.code },
      property.landArea ? { '@type': 'PropertyValue', name: 'Área do terreno', value: property.landArea, unitCode: 'MTK' } : null,
      property.builtArea ? { '@type': 'PropertyValue', name: 'Área construída', value: property.builtArea, unitCode: 'MTK' } : null,
      property.suites !== undefined ? { '@type': 'PropertyValue', name: 'Suítes', value: property.suites } : null,
      property.parking !== undefined ? { '@type': 'PropertyValue', name: 'Vagas de garagem', value: property.parking } : null,
      property.condoFee ? { '@type': 'PropertyValue', name: 'Condomínio (mensal)', value: property.condoFee, unitText: 'BRL' } : null,
      property.iptu ? { '@type': 'PropertyValue', name: 'IPTU', value: property.iptu, unitText: 'BRL' } : null,
    ].filter(Boolean),
  };

  const listing: Node = {
    '@type': 'RealEstateListing',
    '@id': `${url}#anuncio`,
    url,
    name: `${property.title}, ${property.neighborhood || property.city}`,
    description,
    image: images,
    inLanguage: 'pt-BR',
    identifier: property.code,
    isPartOf: { '@id': ids.website },
    provider: { '@id': ids.organization },
    mainEntity: { '@id': `${url}#imovel` },
    offers:
      property.price !== null
        ? {
            '@type': 'Offer',
            url,
            price: property.price,
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            businessFunction: 'http://purl.org/goodrelations/v1#Sell',
            itemOffered: { '@id': `${url}#imovel` },
            seller: { '@id': ids.organization },
          }
        : undefined,
    breadcrumb: breadcrumbList(siteUrl, breadcrumbs),
  };

  return { '@context': 'https://schema.org', '@graph': [listing, place] };
}

export function listingsGraph({
  siteUrl,
  url,
  name,
  description,
  total,
  properties,
  offset,
  breadcrumbs,
}: {
  siteUrl: string;
  url: string;
  name: string;
  description: string;
  total: number;
  properties: PropertySummary[];
  offset: number;
  breadcrumbs: { label: string; href: string }[];
}): Node {
  return {
    '@context': 'https://schema.org',
    '@type': ['CollectionPage', 'SearchResultsPage'],
    '@id': `${absolute(siteUrl, url)}#page`,
    url: absolute(siteUrl, url),
    name,
    description,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': siteIds(siteUrl).website },
    breadcrumb: breadcrumbList(siteUrl, breadcrumbs),
    mainEntity: { '@type': 'ItemList', numberOfItems: total, itemListElement: listItems(siteUrl, properties, offset) },
  };
}

export function homeGraph({
  siteUrl,
  featured,
  neighborhoods,
}: {
  siteUrl: string;
  featured: PropertySummary[];
  neighborhoods: Neighborhood[];
}): Node {
  const ids = siteIds(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/#home`,
    url: siteUrl,
    name: 'Imóveis à venda na Grande Vitória',
    inLanguage: 'pt-BR',
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.organization },
    mainEntity: { '@type': 'ItemList', name: 'Imóveis em destaque', itemListElement: listItems(siteUrl, featured) },
    mentions: neighborhoods.slice(0, 12).map((neighborhood) => ({
      '@type': 'Place',
      name: `${neighborhood.name}, ${neighborhood.city}`,
    })),
  };
}

export function pageGraph({ siteUrl, page, breadcrumbs }: { siteUrl: string; page: Page; breadcrumbs: { label: string; href: string }[] }): Node {
  const ids = siteIds(siteUrl);
  const url = absolute(siteUrl, `/${page.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': page.slug === 'sobre' ? 'AboutPage' : 'WebPage',
    '@id': `${url}#page`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.organization },
    breadcrumb: breadcrumbList(siteUrl, breadcrumbs),
  };
}
