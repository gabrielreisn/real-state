import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Fragment } from 'react';
import type { IconType } from 'react-icons';
import { FaArrowsLeftRight, FaBath, FaBed, FaCar, FaCheck, FaChevronRight, FaShower } from 'react-icons/fa6';
import { Gallery } from '@/components/property/Gallery';
import { LeadForm } from '@/components/property/LeadForm';
import { ShareButtons } from '@/components/property/ShareButtons';
import { PropertyLink } from '@/components/PropertyLink';
import { getPropertyDetail, getPropertyDetailParams, getSiteSettings, phoneLink, type PropertyDetail, SITE_URL } from '@/content';
import { formatPrice } from '@/lib/format';
import { withImageParams } from '@/lib/sanity/url';

type Params = Promise<{ id: string; slug: string }>;

// Prerendered at build, refreshed every minute; listings published later render on first visit.
export const revalidate = 60;
export const generateStaticParams = getPropertyDetailParams;

async function loadProperty(params: Params) {
  const { id, slug } = await params;
  const property = await getPropertyDetail(id);
  if (!property) notFound();
  // Old links can carry an outdated slug; send them to the listing's current address.
  if (property.slug !== slug) permanentRedirect(property.href);
  return property;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const property = await loadProperty(params);
  const description = `${property.title}, ${property.summary}`;
  return {
    title: `${property.title}, ${property.neighborhood}`,
    description,
    alternates: { canonical: property.href },
    openGraph: { title: property.title, description, url: property.href, images: [withImageParams(property.gallery[0].src, { w: 1200, h: 630, fit: 'crop', fm: 'jpg' })] },
  };
}

function jsonLd(property: PropertyDetail, baseUrl: string) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${property.title}, ${property.neighborhood}`,
    description: property.summary,
    url: `${baseUrl}${property.href}`,
    image: property.gallery.slice(0, 6).map((image) => withImageParams(image.src, { w: 1200, fm: 'jpg' })),
    offers: { '@type': 'Offer', price: property.price, priceCurrency: 'BRL' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      addressCountry: 'BR',
    },
  };
  // Keeps listing text from closing the script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function Stat({ icon: Icon, value, label }: { icon: IconType; value: string | number; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-slate">
      <Icon aria-hidden className="text-xl" />
      <span className="text-lg">
        <strong className="font-bold">{value}</strong> {label}
      </span>
    </li>
  );
}

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-slate">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function CheckList({ items, columns = 2 }: { items: string[]; columns?: 2 | 3 }) {
  return (
    <ul className={`mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <FaCheck aria-hidden className="mt-1 shrink-0 text-sm text-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function PropertyPage({ params }: { params: Params }) {
  const [property, site] = await Promise.all([loadProperty(params), getSiteSettings()]);
  const baseUrl = SITE_URL;
  const { description } = property;
  const wholePrice = formatPrice(property.price);
  const currency = (value: number) => formatPrice(value);
  const stats = [
    property.bedrooms !== undefined && { icon: FaBed, value: property.bedrooms, label: 'Dormitórios' },
    property.suites !== undefined && { icon: FaBath, value: property.suites, label: 'Suítes' },
    property.bathrooms !== undefined && { icon: FaShower, value: property.bathrooms, label: 'Banheiros' },
    property.parking !== undefined && { icon: FaCar, value: property.parking, label: 'Vagas' },
    property.area !== undefined && { icon: FaArrowsLeftRight, value: `${property.area} m²`, label: 'Área Privativa' },
    property.area === undefined &&
      property.landArea !== undefined && { icon: FaArrowsLeftRight, value: `${property.landArea} m²`, label: 'Terreno' },
  ].filter((stat) => stat !== false);
  const facts: [string, string | number | undefined][] = [
    ['Código', property.code],
    ['Endereço', property.address || undefined],
    ['Bairro', property.neighborhood],
    ['Condomínio', property.condominium || undefined],
    ['Condomínio (mensal)', property.condoFee !== undefined ? currency(property.condoFee) : undefined],
    ['IPTU', property.iptu !== undefined ? currency(property.iptu) : undefined],
    ['Área Útil', property.area !== undefined ? `${property.area} m²` : undefined],
    ['Área Construída', property.builtArea ? `${property.builtArea} m²` : undefined],
    ['Área do Terreno', property.landArea !== undefined ? `${property.landArea} m²` : undefined],
    ['Em Condomínio', property.inCondominium === undefined ? undefined : property.inCondominium ? 'Sim' : 'Não'],
    ['Sala', property.livingRooms || undefined],
  ];
  // Hand-written listings use the structured fields; imported ones have free text in `body`.
  const structured = Boolean(description.headline || description.highlights.length || description.whyText);
  const bodyParagraphs = description.body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  const breadcrumbs = [
    { label: 'Inicial', href: '/' },
    { label: 'Venda', href: '/#imoveis' },
    { label: property.type, href: `/?tipo=${property.type}#imoveis` },
    { label: property.city, href: `/?cidade=${encodeURIComponent(property.city)}#imoveis` },
    {
      label: property.neighborhood,
      href: `/?cidade=${encodeURIComponent(property.city)}&bairro=${encodeURIComponent(property.neighborhood)}#imoveis`,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(property, baseUrl) }} />

      <div className="bg-navy py-6 text-white">
        <p className="mx-auto max-w-7xl px-4 font-display text-2xl font-bold md:px-8 md:text-3xl">Detalhes do Imóvel</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-5 md:px-8">
        <h1 className="text-3xl leading-tight font-bold md:text-4xl">{property.title}</h1>
        <p className="mt-1.5 text-slate">{property.summary}</p>
      </div>

      <div className="border-y border-line">
        <div className="mx-auto flex max-w-[calc(80rem+((100vw-80rem)/2))] flex-col xl:ml-0 xl:flex-row xl:items-center">
          <p className="arrow-right bg-brand py-4 pr-14 pl-4 text-3xl font-bold whitespace-nowrap text-white md:pl-8 md:text-4xl xl:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            {formatPrice(property.price)}
          </p>
          <ul className="flex flex-wrap gap-x-7 gap-y-3 px-4 py-4 md:px-8 xl:px-6">
            {stats.map((stat) => (
              <Stat key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <nav aria-label="Trilha de navegação" className="py-5 text-sm text-slate">
          <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {breadcrumbs.map((crumb) => (
              <Fragment key={crumb.label}>
                <li>
                  <Link href={crumb.href} className="hover:text-brand hover:underline">
                    {crumb.label}
                  </Link>
                </li>
                <li aria-hidden>
                  <FaChevronRight className="text-[9px]" />
                </li>
              </Fragment>
            ))}
            <li aria-current="page" className="font-medium">
              {property.title} por {wholePrice}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-10">
            <Gallery images={property.gallery} />

            <section aria-labelledby="descricao-titulo">
              <h2 id="descricao-titulo" className="border-b-2 border-brand pb-2 text-2xl font-bold">
                Descrição do Imóvel
              </h2>
              {structured ? (
                <>
                  {description.headline ? <p className="mt-4 text-lg font-medium">{description.headline}</p> : null}
                  {description.intro ? <p className="mt-2">{description.intro}</p> : null}
                  {description.highlights.length > 0 ? (
                    <>
                      <h3 className="mt-7 text-xl font-bold">Destaques do Imóvel</h3>
                      <CheckList items={description.highlights} />
                    </>
                  ) : null}
                  {description.condominiumItems.length > 0 ? (
                    <>
                      <h3 className="mt-7 text-xl font-bold">{description.condominiumTitle || 'Condomínio'}</h3>
                      <CheckList items={description.condominiumItems} />
                    </>
                  ) : null}
                  {description.whyText ? (
                    <>
                      {description.whyTitle ? <h3 className="mt-7 text-xl font-bold">{description.whyTitle}</h3> : null}
                      <p className="mt-3">{description.whyText}</p>
                    </>
                  ) : null}
                  {description.closing.map((paragraph) => (
                    <p key={paragraph} className="mt-4">
                      {paragraph}
                    </p>
                  ))}
                </>
              ) : (
                <div className="mt-4 max-w-prose space-y-4">
                  {bodyParagraphs.map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {description.disclaimers.length > 0 ? (
                <div className="mt-6 space-y-2 border-l-2 border-line pl-4 text-sm text-slate">
                  {description.disclaimers.map((disclaimer) => (
                    <p key={disclaimer}>{disclaimer}</p>
                  ))}
                </div>
              ) : null}
            </section>

            {property.features.length > 0 ? (
            <section aria-labelledby="caracteristicas-titulo">
              <h2 id="caracteristicas-titulo" className="border-b-2 border-brand pb-2 text-2xl font-bold">
                Características
              </h2>
              <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                {property.features.map((group) => (
                  <div key={group.title}>
                    <h3 className="font-sans font-bold">{group.title}</h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <section aria-labelledby="contato-titulo" className="border border-line bg-mist p-5">
              <h2 id="contato-titulo" className="mb-4 text-2xl font-bold text-slate">
                Fale agora Conosco
              </h2>
              <LeadForm propertyCode={property.code} whatsapp={site.whatsapp} />
            </section>

            <section aria-label="Ficha do imóvel" className="border border-line p-5">
              <dl className="text-sm">
                {facts
                  .filter(([, value]) => value !== undefined)
                  .map(([label, value]) => (
                    <FactRow key={label} label={label}>
                      {value}
                    </FactRow>
                  ))}
              </dl>
              <p className="mt-4 mb-2 text-sm font-medium">Compartilhar:</p>
              <ShareButtons
                url={`${baseUrl}${property.href}`}
                title={`${property.title}, ${property.neighborhood}`}
                imageUrl={withImageParams(property.gallery[0].src, { w: 1200, fm: 'jpg' })}
              />
            </section>

            <section aria-labelledby="central-titulo" className="bg-navy p-5 text-white">
              <h2 id="central-titulo" className="text-xl font-bold">
                Central de Negócios
              </h2>
              <p className="mt-2 text-sm">Para ter mais informações sobre este imóvel ligue:</p>
              <a href={phoneLink(site.whatsapp)} className="mt-2 block text-2xl font-bold hover:underline">
                {site.phone}
              </a>
              <p className="mt-3 text-sm leading-6">
                {site.name}
                <br />
                Creci/ES {site.creci}
                <br />
                {site.street}
                <br />
                {site.district}
                <br />
                <a href={`mailto:${site.email}`} className="hover:underline">
                  {site.email}
                </a>
              </p>
            </section>
          </aside>
        </div>
      </div>

      {property.similar.length > 0 ? (
      <section aria-labelledby="similares-titulo" className="bg-mist py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 id="similares-titulo" className="text-2xl font-bold">
            Imóveis em {property.neighborhood}, {property.city}
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {property.similar.map((listing) => (
              <li key={listing.id}>
                <PropertyLink href={listing.href} className="group block h-full bg-white shadow-sm transition hover:shadow-md">
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Image
                      src={listing.image.src}
                      alt={listing.image.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      placeholder={listing.image.lqip ? 'blur' : 'empty'}
                      blurDataURL={listing.image.lqip}
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate">
                      {listing.type} · Cód. {listing.code}
                    </p>
                    <p className="mt-1 line-clamp-2 font-medium">{listing.excerpt}</p>
                    <p className="mt-2 text-lg font-bold text-brand">{formatPrice(listing.price)}</p>
                  </div>
                </PropertyLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
      ) : null}

    </>
  );
}
