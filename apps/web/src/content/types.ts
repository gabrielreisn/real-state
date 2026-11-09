export type Image = { src: string; alt: string; width?: number; height?: number; /** Tiny blurred preview from Sanity. */ lqip?: string };

export type PropertySummary = {
  id: string;
  code: string;
  slug: string;
  type: string;
  purpose: 'Venda';
  city: string;
  neighborhood: string;
  state: string;
  /** Null means the price is only given on request. */
  price: number | null;
  area?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parking?: number;
  image: Image;
  /** Up to CARD_PHOTOS photos for the card carousel, the cover first. */
  photos: Image[];
  /** Every photo in the listing's gallery, for the card's "more photos" hint. */
  photoCount: number;
  excerpt: string;
  /** Internal path when the listing has a page here; otherwise its page on the live site. */
  href: string;
};

export type FeatureGroup = { title: string; items: string[] };

export type PropertyDetail = PropertySummary & {
  title: string;
  summary: string;
  address: string;
  cep: string;
  condominium: string;
  builtArea?: number;
  landArea?: number;
  livingRooms?: number;
  inCondominium?: boolean;
  condoFee?: number;
  iptu?: number;
  gallery: Image[];
  description: {
    /** Free text, one paragraph per blank line. Imported listings only have this. */
    body: string;
    headline: string;
    intro: string;
    highlights: string[];
    condominiumTitle: string;
    condominiumItems: string[];
    whyTitle: string;
    whyText: string;
    closing: string[];
    disclaimers: string[];
  };
  features: FeatureGroup[];
  similar: PropertySummary[];
};

/** Mirrors the Sanity `neighborhood` document: listings reference one, and it works as a category. */
export type NeighborhoodEntity = { name: string; slug: string; city: string; state: string };

export type Neighborhood = NeighborhoodEntity & { count: number };

export type SiteSettings = {
  name: string;
  brandName: string;
  role: string;
  creci: string;
  phone: string;
  whatsapp: string;
  email: string;
  street: string;
  district: string;
  postalCode?: string;
  addressLocality?: string;
  addressRegion?: string;
  openingHours: { days: string[]; opens: string; closes: string }[];
  sameAs: string[];
};

export type MenuPage = { title: string; slug: string };

export type PageForm = 'propertySubmission';

export type Page = MenuPage & {
  description?: string;
  /** Portable Text from Sanity: blocks plus `linkCards` and `mapEmbed` objects. */
  body: unknown[];
  form?: PageForm;
  formTitle?: string;
};
