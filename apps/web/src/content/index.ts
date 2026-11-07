// The only module the app reads content through: published documents from Sanity, mapped
// into the shapes the components use.
import { cache } from 'react';
import { sanityFetch } from '@/lib/sanity/client';
import { IMAGE_PROJECTION, type SanityImage, toImage } from '@/lib/sanity/image';
import type { FeatureGroup, Neighborhood, PropertyDetail, PropertySummary, SiteSettings } from './types';

export { legacy, phoneLink, whatsappLink } from './site';
export type * from './types';

export const SITE_URL = process.env.SITE_URL ?? 'https://www.alexnolasco.com.br';

const LISTED = /* groq */ `_type == "property" && defined(slug.current) && defined(coverImage.asset) && defined(neighborhood)`;

const SUMMARY_FIELDS = /* groq */ `
  "id": coalesce(legacyId, code),
  code,
  "slug": slug.current,
  type,
  purpose,
  price,
  "area": coalesce(area, landArea),
  bedrooms,
  suites,
  bathrooms,
  parking,
  excerpt,
  externalUrl,
  "city": neighborhood->city,
  "neighborhood": neighborhood->name,
  "state": neighborhood->state,
  "image": coverImage ${IMAGE_PROJECTION}
`;

type RawSummary = {
  id: string;
  code: string;
  slug: string;
  type: string;
  purpose: 'Venda' | null;
  price: number | null;
  area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking: number | null;
  excerpt: string | null;
  externalUrl: string | null;
  city: string;
  neighborhood: string;
  state: string | null;
  image: SanityImage;
};

const optional = <T,>(value: T | null | undefined) => value ?? undefined;

function toSummary(raw: RawSummary): PropertySummary {
  return {
    id: raw.id,
    code: raw.code,
    slug: raw.slug,
    type: raw.type,
    purpose: raw.purpose ?? 'Venda',
    city: raw.city,
    neighborhood: raw.neighborhood,
    state: raw.state ?? 'ES',
    price: raw.price,
    area: optional(raw.area),
    bedrooms: optional(raw.bedrooms),
    suites: optional(raw.suites),
    bathrooms: optional(raw.bathrooms),
    parking: optional(raw.parking),
    image: toImage(raw.image)!,
    excerpt: raw.excerpt ?? '',
    // Listings that are not complete here yet keep pointing at their page on the live site.
    href: raw.externalUrl ?? `/imovel/${raw.id}/${raw.slug}`,
  };
}

const summaries = (raws: (RawSummary | null)[] | null) => (raws ?? []).filter((raw) => raw?.image?.asset).map((raw) => toSummary(raw!));

// cache() dedupes calls within one request, e.g. the layout and the page both asking for settings.
export const getProperties = cache(async () =>
  summaries(await sanityFetch<RawSummary[]>(`*[${LISTED}] | order(code desc) { ${SUMMARY_FIELDS} }`)),
);

export const getFeaturedProperties = cache(async () =>
  summaries(await sanityFetch<(RawSummary | null)[] | null>(`*[_id == "siteSettings"][0].featuredProperties[]->{ ${SUMMARY_FIELDS} }`)),
);

export const getPropertyTypes = cache(async () =>
  (await sanityFetch<string[]>(`array::unique(*[${LISTED}].type)`)).toSorted((a, b) => a.localeCompare(b, 'pt-BR')),
);

export const getNeighborhoods = cache(
  async () =>
    sanityFetch<Neighborhood[]>(`
      *[_type == "neighborhood"] {
        name,
        "slug": slug.current,
        city,
        state,
        "count": count(*[${LISTED} && references(^._id)])
      }[count > 0] | order(count desc, name asc)
    `),
);

export const getSiteSettings = cache(async () => {
  const settings = await sanityFetch<SiteSettings | null>(
    `*[_id == "siteSettings"][0] { name, brandName, role, creci, phone, whatsapp, email, street, district }`,
  );
  if (!settings) throw new Error('The "siteSettings" document is missing from the dataset. Create it in Sanity Studio, or copy a dataset that has it.');
  return settings;
});

/** Listings with their own page here: the ones without a link to the live site. */
export const getPropertyDetailParams = cache(async () =>
  sanityFetch<{ id: string; slug: string }[]>(
    `*[${LISTED} && !defined(externalUrl)] { "id": coalesce(legacyId, code), "slug": slug.current }`,
  ),
);

type RawDetail = RawSummary & {
  title: string | null;
  summary: string | null;
  address: string | null;
  condominium: string | null;
  builtArea: number | null;
  landArea: number | null;
  livingRooms: number | null;
  inCondominium: boolean | null;
  condoFee: number | null;
  iptu: number | null;
  rawArea: number | null;
  gallery: SanityImage[] | null;
  description: Partial<Record<keyof PropertyDetail['description'], string | string[] | null>> | null;
  features: FeatureGroup[] | null;
  similar: (RawSummary | null)[] | null;
};

export const getPropertyDetail = cache(async (id: string): Promise<PropertyDetail | null> => {
  const raw = await sanityFetch<RawDetail | null>(
    `*[${LISTED} && !defined(externalUrl) && coalesce(legacyId, code) == $id][0] {
      ${SUMMARY_FIELDS},
      title,
      summary,
      address,
      condominium,
      builtArea,
      landArea,
      livingRooms,
      inCondominium,
      condoFee,
      iptu,
      "rawArea": area,
      "gallery": gallery[] ${IMAGE_PROJECTION},
      description,
      "features": featureGroups[] { title, "items": coalesce(items, []) },
      // Hand-picked when set; otherwise other listings in the same neighborhood.
      "similar": select(
        count(similar) > 0 => similar[]->{ ${SUMMARY_FIELDS} },
        *[${LISTED} && neighborhood._ref == ^.neighborhood._ref && _id != ^._id] | order(code desc) [0...3] { ${SUMMARY_FIELDS} }
      )
    }`,
    { id },
  );
  if (!raw) return null;

  const summary = toSummary(raw);
  const text = (value: string | string[] | null | undefined) => (typeof value === 'string' ? value : '');
  const list = (value: string | string[] | null | undefined) => (Array.isArray(value) ? value : []);
  const description = raw.description ?? {};
  const gallery = (raw.gallery ?? []).map(toImage).filter((image) => image !== null);

  return {
    ...summary,
    title: raw.title ?? `${summary.type} para ${summary.purpose}, ${summary.city} / ${summary.state}`,
    summary: raw.summary ?? '',
    address: raw.address ?? '',
    condominium: raw.condominium ?? '',
    // The summary's area falls back to the land area; the detail page shows them separately.
    area: optional(raw.rawArea),
    builtArea: optional(raw.builtArea),
    landArea: optional(raw.landArea),
    livingRooms: optional(raw.livingRooms),
    inCondominium: optional(raw.inCondominium),
    condoFee: optional(raw.condoFee),
    iptu: optional(raw.iptu),
    gallery: gallery.length > 0 ? gallery : [summary.image],
    description: {
      body: text(description.body),
      headline: text(description.headline),
      intro: text(description.intro),
      highlights: list(description.highlights),
      condominiumTitle: text(description.condominiumTitle),
      condominiumItems: list(description.condominiumItems),
      whyTitle: text(description.whyTitle),
      whyText: text(description.whyText),
      closing: list(description.closing),
      disclaimers: list(description.disclaimers),
    },
    features: raw.features ?? [],
    similar: summaries(raw.similar),
  };
});
