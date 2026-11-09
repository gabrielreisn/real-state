'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaXmark } from 'react-icons/fa6';
import type { Image as GalleryImage } from '@/content/types';
import { galleryFrameRatio } from '@/lib/gallery-frame';

const control =
  'flex size-11 items-center justify-center rounded-full bg-white/95 text-navy shadow-md transition-colors duration-150 hover:bg-brand hover:text-white motion-reduce:transition-none';
const pill = 'rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm';

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const thumbnails = useRef<HTMLUListElement>(null);

  const go = (delta: number) => setActive((index) => (index + delta + images.length) % images.length);

  useEffect(() => {
    const strip = thumbnails.current;
    const thumbnail = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumbnail) return;
    // Scrolls only the strip; scrollIntoView would also move the page.
    strip.scrollTo({ left: thumbnail.offsetLeft - (strip.clientWidth - thumbnail.clientWidth) / 2, behavior: 'smooth' });
  }, [active]);

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') go(-1);
    if (event.key === 'ArrowRight') go(1);
  };

  const image = images[active];
  const frame = galleryFrameRatio(images);
  // Phones cap the frame so a very wide one stays tall enough for the controls.
  const frameStyle = { '--frame': frame, '--frame-phone': Math.min(frame, 16 / 9) } as CSSProperties;

  return (
    <div>
      <div
        className="relative aspect-(--frame-phone) overflow-hidden rounded-lg bg-[#141414] sm:aspect-(--frame)"
        style={frameStyle}
        role="group"
        aria-label="Fotos do imóvel"
        onKeyDown={handleKey}
      >
        {image.lqip && (
          <div aria-hidden className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-75" style={{ backgroundImage: `url("${image.lqip}")` }} />
        )}
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          priority={active === 0}
          quality={85}
          sizes="(min-width: 1024px) 800px, 100vw"
          placeholder={image.lqip ? 'blur' : 'empty'}
          blurDataURL={image.lqip}
          className="object-contain"
        />
        <button type="button" aria-label="Foto anterior" onClick={() => go(-1)} className={clsx(control, 'absolute top-1/2 left-3 -translate-y-1/2')}>
          <FaChevronLeft aria-hidden />
        </button>
        <button type="button" aria-label="Próxima foto" onClick={() => go(1)} className={clsx(control, 'absolute top-1/2 right-3 -translate-y-1/2')}>
          <FaChevronRight aria-hidden />
        </button>
        <button type="button" aria-label="Ver em tela cheia" onClick={() => dialog.current?.showModal()} className={clsx(control, 'absolute top-3 right-3')}>
          <FaExpand aria-hidden />
        </button>
        <span aria-live="polite" className={clsx(pill, 'absolute bottom-3 left-3 tabular-nums')}>
          {active + 1} / {images.length}
        </span>
      </div>

      <ul ref={thumbnails} className="scrollbar-none relative -mx-1 mt-1 flex gap-2 overflow-x-auto overflow-y-hidden p-1">
        {images.map((thumbnail, index) => (
          <li key={thumbnail.src} className="shrink-0">
            <button
              type="button"
              aria-label={`Ver foto ${index + 1}: ${thumbnail.alt}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
              className={clsx(
                'relative block h-16 w-24 overflow-hidden rounded-lg bg-[#141414] outline-offset-1 transition-opacity duration-150 motion-reduce:transition-none',
                index === active ? 'ring-2 ring-brand ring-offset-2' : 'opacity-70 hover:opacity-100',
              )}
            >
              <Image src={thumbnail.src} alt="" fill sizes="96px" quality={60} loading="lazy" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label="Fotos do imóvel em tela cheia"
        onKeyDown={handleKey}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black/95 backdrop:bg-black"
      >
        <div className="relative h-full w-full">
          <Image src={image.src} alt={image.alt} fill quality={85} sizes="100vw" className="object-contain" />
          <button type="button" aria-label="Foto anterior" onClick={() => go(-1)} className={clsx(control, 'absolute top-1/2 left-3 -translate-y-1/2')}>
            <FaChevronLeft aria-hidden />
          </button>
          <button type="button" aria-label="Próxima foto" onClick={() => go(1)} className={clsx(control, 'absolute top-1/2 right-3 -translate-y-1/2')}>
            <FaChevronRight aria-hidden />
          </button>
          <button type="button" aria-label="Fechar" onClick={() => dialog.current?.close()} className={clsx(control, 'absolute top-3 right-3')}>
            <FaXmark aria-hidden />
          </button>
          <span className={clsx(pill, 'absolute bottom-3 left-1/2 max-w-[90%] -translate-x-1/2 truncate')}>
            {active + 1} / {images.length} — {image.alt}
          </span>
        </div>
      </dialog>
    </div>
  );
}
