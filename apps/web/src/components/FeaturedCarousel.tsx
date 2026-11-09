'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import type { PropertySummary } from '@/content/types';
import { formatPrice } from '@/lib/format';
import { PropertyFacts } from './PropertyFacts';
import { PropertyLink } from './PropertyLink';

const stepButton = 'flex h-11 w-11 items-center justify-center rounded-full border border-navy/30 bg-white hover:border-navy';

export function FeaturedCarousel({ properties }: { properties: PropertySummary[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    const element = track.current;
    if (!element) return;
    element.scrollTo({ left: element.clientWidth * ((index + properties.length) % properties.length) });
  };

  return (
    <section aria-labelledby="destaques-titulo" aria-roledescription="carrossel" className="bg-mist py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 id="destaques-titulo" className="text-[2rem] leading-tight font-bold tracking-tight md:text-[2.5rem]">
            Destaques
          </h2>
          <div className="flex items-center gap-2">
            <p className="mr-2 text-slate tabular-nums" aria-live="polite">
              {active + 1} de {properties.length}
            </p>
            <button type="button" aria-label="Destaque anterior" onClick={() => goTo(active - 1)} className={stepButton}>
              <FaChevronLeft aria-hidden />
            </button>
            <button type="button" aria-label="Próximo destaque" onClick={() => goTo(active + 1)} className={stepButton}>
              <FaChevronRight aria-hidden />
            </button>
          </div>
        </div>

        <ul
          ref={track}
          onScroll={(event) => {
            const { scrollLeft, clientWidth } = event.currentTarget;
            setActive(Math.round(scrollLeft / clientWidth));
          }}
          className="scrollbar-none relative mt-8 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth motion-reduce:scroll-auto"
        >
          {properties.map((property, index) => (
            <li
              key={property.id}
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${properties.length}`}
              className="w-full shrink-0 snap-start"
            >
              {/* One link covers the whole slide, so the photo and every line of text open the listing. */}
              <article className="group relative grid items-center gap-6 rounded-sm md:grid-cols-12 md:gap-12 has-[a:focus-visible]:outline-3 has-[a:focus-visible]:-outline-offset-3 has-[a:focus-visible]:outline-brand">
                <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-white md:col-span-7">
                  <Image
                    src={property.image.src}
                    alt={property.image.alt}
                    fill
                    sizes="(min-width: 768px) 700px, 100vw"
                    placeholder={property.image.lqip ? 'blur' : 'empty'}
                    blurDataURL={property.image.lqip}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                  />
                </div>
                <div className="md:col-span-5">
                  <h3 className="text-2xl leading-tight font-bold tracking-tight transition-colors duration-200 group-hover:text-brand md:text-[2rem]">
                    <PropertyLink href={property.href} className="after:absolute after:inset-0 focus-visible:outline-none">
                      {property.type} em {property.neighborhood || property.city}
                    </PropertyLink>
                  </h3>
                  <p className="mt-1 text-slate">
                    {property.city}, código {property.code}
                  </p>
                  <p className="mt-5 text-3xl font-bold text-brand">{formatPrice(property.price)}</p>
                  <PropertyFacts property={property} className="mt-2" />
                  {property.excerpt ? <p className="mt-5 line-clamp-3 max-w-prose text-slate">{property.excerpt}</p> : null}
                  {/* Looks like a button; the slide's link already takes the click and the focus. */}
                  <span
                    aria-hidden
                    className="mt-7 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 font-semibold text-white transition-colors duration-200 group-hover:bg-navy-soft"
                  >
                    Ver anúncio
                    <FaArrowRight className="text-sm transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
