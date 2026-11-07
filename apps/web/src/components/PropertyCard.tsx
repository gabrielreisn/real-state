import Image from 'next/image';
import type { PropertySummary } from '@/content/types';
import { formatPrice } from '@/lib/format';
import { PropertyFacts } from './PropertyFacts';
import { PropertyLink } from './PropertyLink';

export function PropertyCard({ property }: { property: PropertySummary }) {
  return (
    <article className="group relative flex h-full flex-col has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-brand">
      <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-mist">
        <Image
          src={property.image.src}
          alt={property.image.alt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          placeholder={property.image.lqip ? 'blur' : 'empty'}
          blurDataURL={property.image.lqip}
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <h3 className="text-xl leading-snug font-semibold">
          {/* The link covers the whole card, so the photo is clickable too. */}
          <PropertyLink href={property.href} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline">
            {property.type} em {property.neighborhood}
          </PropertyLink>
        </h3>
        <p className="mt-0.5 text-slate">
          {property.city}, código {property.code}
        </p>
        <p className="mt-3 text-2xl font-bold text-brand">{formatPrice(property.price)}</p>
        <PropertyFacts property={property} className="mt-2" />
      </div>
    </article>
  );
}
