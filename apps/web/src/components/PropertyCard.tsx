import type { PropertySummary } from '@/content/types';
import { formatPrice } from '@/lib/format';
import { CardGallery } from './CardGallery';
import { PropertyFacts } from './PropertyFacts';
import { PropertyLink } from './PropertyLink';

/**
 * Every line has a fixed height (one line of text each, two for the facts), so all cards in a
 * row end at the same place whatever the listing has filled in.
 */
export function PropertyCard({ property }: { property: PropertySummary }) {
  const place = `${property.neighborhood}, ${property.city}`;
  return (
    <article className="reveal group relative flex h-full flex-col rounded-md has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-brand">
      <CardGallery photos={property.photos} total={property.photoCount} href={property.href} />
      <div className="flex flex-1 flex-col pt-4">
        {/* The full text is in the tooltip when a long name is cut short. */}
        <h3 className="truncate text-lg leading-snug font-semibold transition-colors duration-200 group-hover:text-brand" title={place}>
          {/* The link covers the whole card; the photo strip sits above it and links on its own. */}
          <PropertyLink href={property.href} className="after:absolute after:inset-0 focus-visible:outline-none">
            <span className="sr-only">{property.type} em </span>
            {place}
          </PropertyLink>
        </h3>
        <p className="mt-0.5 truncate text-slate transition-colors duration-200 group-hover:text-brand">
          {property.type} · código {property.code}
        </p>
        {/* Read after the title by screen readers, shown first because buyers scan by price. */}
        <p className="order-first mb-1 truncate text-2xl font-bold tracking-tight text-brand">{formatPrice(property.price)}</p>
        <div className="mt-3 border-t border-line pt-3 text-[0.95rem]">
          <div className="h-[calc(2lh+0.375rem)] overflow-hidden">
            <PropertyFacts property={property} className="transition-colors duration-200 group-hover:text-brand" />
          </div>
        </div>
      </div>
    </article>
  );
}
