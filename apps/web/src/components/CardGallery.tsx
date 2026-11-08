'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import type { Image as Photo } from '@/content/types';
import { PropertyLink } from './PropertyLink';

const SIZES = '(min-width: 1536px) 340px, (min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw';

const arrow =
  'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-sm text-navy shadow-md ' +
  'opacity-0 transition duration-200 ease-out group-hover/gallery:translate-x-0 group-hover/gallery:opacity-100 hover:bg-white ' +
  'disabled:invisible pointer-coarse:hidden motion-reduce:transition-none';

/**
 * A swipeable strip of a few photos on each card. Only the cover loads with the page; the
 * others load once the visitor hovers or swipes, so a page of 24 cards stays light.
 *
 * The strip repeats what the card's title link already says, so it is hidden from screen
 * readers and kept out of the tab order; every photo still opens the listing when clicked.
 */
export function CardGallery({ photos, total, href }: { photos: Photo[]; total: number; href: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [armed, setArmed] = useState(false);
  const arm = () => setArmed(true);
  const last = photos.length - 1;
  const hidden = total - photos.length;

  const go = (to: number) => {
    arm();
    const element = track.current;
    if (element) element.scrollTo({ left: element.clientWidth * Math.max(0, Math.min(last, to)) });
  };

  return (
    <div aria-hidden className="group/gallery relative z-10 overflow-hidden rounded-md bg-mist shadow-[0_1px_2px_rgb(15_26_58/0.06)] transition-shadow duration-300 ease-out group-hover:shadow-[0_18px_40px_-18px_rgb(15_26_58/0.45)]" onPointerEnter={arm}>
      <div
        ref={track}
        tabIndex={-1}
        onTouchStart={arm}
        onScroll={(event) => {
          arm();
          const { scrollLeft, clientWidth } = event.currentTarget;
          setIndex(Math.round(scrollLeft / clientWidth));
        }}
        className="scrollbar-none flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto"
      >
        {photos.map((photo, i) => (
          <PropertyLink key={photo.src} href={href} tabIndex={-1} className="relative block h-full w-full shrink-0 snap-start snap-always overflow-hidden">
            {i === 0 || armed ? (
              <Image
                src={photo.src}
                alt=""
                fill
                sizes={SIZES}
                placeholder={photo.lqip ? 'blur' : 'empty'}
                blurDataURL={photo.lqip}
                className="animate-fade-in object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            ) : null}
            {i === last && hidden > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-lg font-semibold text-white">
                +{hidden} {hidden === 1 ? 'foto' : 'fotos'}
              </span>
            ) : null}
          </PropertyLink>
        ))}
      </div>

      {photos.length > 1 ? (
        <>
          <button type="button" tabIndex={-1} aria-label="Foto anterior" disabled={index === 0} onClick={() => go(index - 1)} className={clsx(arrow, 'left-2 -translate-x-1')}>
            <FaChevronLeft />
          </button>
          <button type="button" tabIndex={-1} aria-label="Próxima foto" disabled={index === last} onClick={() => go(index + 1)} className={clsx(arrow, 'right-2 translate-x-1')}>
            <FaChevronRight />
          </button>
          {/* Shade under the dots, so they stay visible on bright photos. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {photos.map((photo, i) => (
              <span
                key={photo.src}
                className={clsx(
                  'h-1.5 rounded-full bg-white transition-all duration-300 ease-out motion-reduce:transition-none',
                  i === index ? 'w-4' : 'w-1.5 opacity-60',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
