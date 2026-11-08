'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaXmark } from 'react-icons/fa6';
import type { Image as GalleryImage } from '@/content/types';

const control = 'flex h-11 w-11 items-center justify-center bg-black/65 text-white hover:bg-brand';

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

  return (
    <div>
      <div className="relative aspect-[16/10] bg-[#141414]" role="group" aria-label="Fotos do imóvel" onKeyDown={handleKey}>
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
        <button type="button" aria-label="Foto anterior" onClick={() => go(-1)} className={clsx(control, 'absolute top-1/2 left-2 -translate-y-1/2')}>
          <FaChevronLeft aria-hidden />
        </button>
        <button type="button" aria-label="Próxima foto" onClick={() => go(1)} className={clsx(control, 'absolute top-1/2 right-2 -translate-y-1/2')}>
          <FaChevronRight aria-hidden />
        </button>
        <button type="button" aria-label="Ver em tela cheia" onClick={() => dialog.current?.showModal()} className={clsx(control, 'absolute top-2 right-2')}>
          <FaExpand aria-hidden />
        </button>
        <span aria-live="polite" className="absolute bottom-2 left-2 bg-black/65 px-2 py-1 text-sm text-white">
          {active + 1} / {images.length}
        </span>
      </div>

      <ul ref={thumbnails} className="scrollbar-none relative mt-2 flex gap-2 overflow-x-auto overflow-y-hidden">
        {images.map((thumbnail, index) => (
          <li key={thumbnail.src} className="shrink-0">
            <button
              type="button"
              aria-label={`Ver foto ${index + 1}: ${thumbnail.alt}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
              className={clsx('relative block h-16 w-24 overflow-hidden bg-[#141414]', index === active ? 'ring-2 ring-brand ring-inset' : 'opacity-70 hover:opacity-100')}
            >
              <Image src={thumbnail.src} alt="" fill sizes="96px" quality={60} loading="lazy" className={clsx('object-cover', index === active && 'p-0.5')} />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label="Fotos do imóvel em tela cheia"
        onKeyDown={handleKey}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 backdrop:bg-black"
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
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm text-white">
            {active + 1} / {images.length} — {image.alt}
          </span>
        </div>
      </dialog>
    </div>
  );
}
