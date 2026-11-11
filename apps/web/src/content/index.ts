// The only module the app reads content through: documents from Sanity (drafts in preview mode), mapped
// into the shapes the components use.
import { cache } from 'react';
import { sanityFetch } from '@/lib/sanity/live';
import { IMAGE_PROJECTION, type SanityImage, toImage } from '@/lib/sanity/image';
import { GALLERY_PROJECTION, toGalleryMedia, type RawGalleryMedia } from '@/lib/sanity/gallery';
import type { FeatureGroup, Image, MenuPage, Neighborhood, Page, PropertyDetail, PropertySummary, SiteSettings } from './types';

export { legacy, phoneLink, whatsappLink } from './site';
export type * from './types';

export const SITE_URL = process.env.SITE_URL ?? 'https://www.alexnolasco.com.br';

const LISTED = /* groq */ `_type == "property" && available != false && defined(slug.current) && defined(coverImage.asset) && (defined(neighborhood) || defined(city))`;

/** Photos in each card's carousel. The rest are on the listing page. */
export const CARD_PHOTOS = 5;
// Card photos after the cover load on interaction, so they skip the blur placeholder.
const LIGHT_IMAGE_PROJECTION = /* groq */ `{ alt, watermark, crop, hotspot, asset->{ _id } }`;

const SUMMARY_FIELDS = /* groq */ `
  "id": code,
  code,
  available,
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
  condominium,
  address,
  "city": coalesce(neighborhood->city, city),
  "neighborhood": coalesce(neighborhood->name, ""),
  "state": neighborhood->state,
  "image": coverImage ${IMAGE_PROJECTION},
  "photos": gallery[_type == "image"][0...${CARD_PHOTOS + 1}] ${LIGHT_IMAGE_PROJECTION},
  "photoCount": count(gallery[_type == "image"]),
  "watermark": *[_id == "siteSettings"][0].watermarkImage ${IMAGE_PROJECTION}
`;

type RawSummary = {
  id: string;
  code: string;
  available: boolean | null;
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
  condominium: string | null;
  address: string | null;
  city: string;
  neighborhood: string;
  state: string | null;
  image: SanityImage;
  photos: SanityImage[] | null;
  photoCount: number | null;
  watermark: SanityImage;
};

const optional = <T,>(value: T | null | undefined) => value ?? undefined;

const withoutParams = (src: string) => src.split('?')[0];

function toSummary(raw: RawSummary): PropertySummary {
  const watermark = toImage(raw.watermark)?.src;
  const cover = toImage(raw.image, watermark)!;
  // Imported galleries start with the cover, and a few repeat a photo; each shows once.
  const photos: Image[] = [];
  for (const photo of [cover, ...(raw.photos ?? []).map((photo) => toImage(photo, watermark))]) {
    const duplicate = photos.some((kept) => withoutParams(kept.src) === withoutParams(photo?.src ?? ''));
    if (photo && !duplicate && photos.length < CARD_PHOTOS) photos.push(photo);
  }
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
    image: cover,
    photos,
    photoCount: Math.max(raw.photoCount ?? 0, photos.length),
    excerpt: raw.excerpt ?? '',
    condominium: optional(raw.condominium),
    address: optional(raw.address),
    href: `/imovel/${raw.id}/${raw.slug}`,
  };
}

const summaries = (raws: (RawSummary | null)[] | null) => (raws ?? []).filter((raw) => raw?.available !== false && raw?.image?.asset).map((raw) => toSummary(raw!));

// cache() dedupes calls within one request, e.g. the layout and the page both asking for settings.
export const getProperties = cache(async () =>
  summaries(await sanityFetch<RawSummary[]>(`*[${LISTED}] | order(code desc) { ${SUMMARY_FIELDS} }`)),
);

/** What the site-wide structured data needs: a small query, so pages that list no properties don't fetch them all. */
export const getListingStats = cache(async () => {
  const stats = await sanityFetch<{ cities: (string | null)[]; minPrice: number | null; maxPrice: number | null }>(`{
    "cities": array::unique(*[${LISTED}]{ "city": coalesce(neighborhood->city, city) }.city),
    "minPrice": math::min(*[${LISTED} && price > 0].price),
    "maxPrice": math::max(*[${LISTED} && price > 0].price)
  }`);
  return {
    cities: stats.cities.filter((city): city is string => Boolean(city)).toSorted((a, b) => a.localeCompare(b, 'pt-BR')),
    priceRange: stats.minPrice !== null && stats.maxPrice !== null ? ([stats.minPrice, stats.maxPrice] as [number, number]) : undefined,
  };
});

export const getFeaturedProperties = cache(async () =>
  summaries(await sanityFetch<(RawSummary | null)[] | null>(`*[_id == "siteSettings"][0].featuredProperties[]->{ ${SUMMARY_FIELDS} }`)),
);

/** The photo behind the home page search, when an editor has chosen one. */
export const getHeroImage = cache(async () => toImage(await sanityFetch<SanityImage>(`*[_id == "siteSettings"][0].heroImage ${IMAGE_PROJECTION}`)));

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
  const settings = await sanityFetch<(Omit<SiteSettings, 'logo'> & { logo: SanityImage }) | null>(
    `*[_id == "siteSettings"][0] {
      name, brandName, role, creci, phone, whatsapp, email, street, district, postalCode, addressLocality, addressRegion,
      "logo": logo ${IMAGE_PROJECTION},
      "openingHours": coalesce(openingHours[]{ "days": coalesce(days, []), opens, closes }, []),
      "sameAs": coalesce(sameAs, [])
    }`,
  );
  if (!settings) throw new Error('The "siteSettings" document is missing from the dataset. Create it in Sanity Studio, or copy a dataset that has it.');
  return { ...settings, logo: toImage(settings.logo) };
});

export const getPropertyDetailParams = cache(async () =>
  sanityFetch<{ id: string; slug: string }[]>(
    `*[${LISTED}] { "id": code, "slug": slug.current }`,
    {},
    { published: true },
  ),
);

type RawDetail = RawSummary & {
  title: string | null;
  summary: string | null;
  cep: string | null;
  builtArea: number | null;
  landArea: number | null;
  livingRooms: number | null;
  inCondominium: boolean | null;
  condoFee: number | null;
  iptu: number | null;
  rawArea: number | null;
  gallery: (RawGalleryMedia | null)[] | null;
  description: Partial<Record<keyof PropertyDetail['description'], string | string[] | null>> | null;
  features: FeatureGroup[] | null;
  similar: (RawSummary | null)[] | null;
};

export const getPropertyDetail = cache(async (id: string): Promise<PropertyDetail | null> => {
  const raw = await sanityFetch<RawDetail | null>(
    `*[${LISTED} && code == $id][0] {
      ${SUMMARY_FIELDS},
      title,
      summary,
      cep,
      builtArea,
      landArea,
      livingRooms,
      inCondominium,
      condoFee,
      iptu,
      "rawArea": area,
      "gallery": gallery[] ${GALLERY_PROJECTION},
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
  const watermark = toImage(raw.watermark)?.src;
  const gallery = (raw.gallery ?? []).map((media) => toGalleryMedia(media, watermark)).filter((media) => media !== null);

  return {
    ...summary,
    title: raw.title ?? `${summary.type} para ${summary.purpose}, ${summary.city} / ${summary.state}`,
    summary: raw.summary ?? '',
    address: raw.address ?? '',
    cep: raw.cep ?? '',
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

/** The public information menu has a deliberate, stable order. New enabled pages follow it alphabetically. */
const MENU_ORDER = ['sobre', 'seu-imovel', 'financiamento', 'correspondente'];

export const getMenuPages = cache(async () =>
  (await sanityFetch<MenuPage[]>(`*[_type == "page" && defined(slug.current) && showInMenu != false] { title, "slug": slug.current }`)).toSorted(
    (a, b) => {
      const aOrder = MENU_ORDER.indexOf(a.slug);
      const bOrder = MENU_ORDER.indexOf(b.slug);
      return (aOrder < 0 ? MENU_ORDER.length : aOrder) - (bOrder < 0 ? MENU_ORDER.length : bOrder) || a.title.localeCompare(b.title, 'pt-BR');
    },
  ),
);

export const getPageSlugs = cache(async () =>
  sanityFetch<{ page: string }[]>(`*[_type == "page" && defined(slug.current)] { "page": slug.current }`, {}, { published: true }),
);

export const getPage = cache(async (slug: string) => {
  const page = await sanityFetch<(Page & { description: string | null; form: Page['form'] | null; formTitle: string | null }) | null>(
    `*[_type == "page" && slug.current == $slug][0] { title, "slug": slug.current, description, "body": coalesce(body[]{ ..., _type == "linkCards" => { links[]{ ..., "logoUrl": logo.asset->url } } }, []), form, formTitle }`,
    { slug },
  );
  if (!page) return null;
  return { ...page, description: page.description ?? undefined, form: page.form ?? undefined, formTitle: page.formTitle ?? undefined } satisfies Page;
});

/** Everything the sitemap lists, with last-modified dates from Sanity. */
export const getSitemapEntries = cache(async () =>
  sanityFetch<{ properties: { href: string; updatedAt: string }[]; pages: { slug: string; updatedAt: string }[] }>(`{
    "properties": *[${LISTED}] { "href": "/imovel/" + code + "/" + slug.current, "updatedAt": _updatedAt },
    "pages": *[_type == "page" && defined(slug.current)] { "slug": slug.current, "updatedAt": _updatedAt }
  }`, {}, { published: true }),
);
