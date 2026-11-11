'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { type CSSProperties, type KeyboardEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaPlay, FaXmark } from 'react-icons/fa6';
import type { GalleryMedia } from '@/content/types';
import { galleryFrameRatio } from '@/lib/gallery-frame';
import { PropertyWatermark } from '../PropertyWatermark';

const VideoPlayer = dynamic(() => import('./VideoPlayer').then((module) => module.VideoPlayer));

const control =
  'z-30 flex size-11 items-center justify-center rounded-full bg-white/95 text-navy shadow-md transition-colors duration-150 hover:bg-brand hover:text-white motion-reduce:transition-none';
const pill = 'rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm';

function MediaFrame({ media, videoRef, fullscreen = false, eager = false }: {
  media: GalleryMedia; videoRef: RefObject<HTMLVideoElement | null>; fullscreen?: boolean; eager?: boolean;
}) {
  if (media.kind === 'video') {
    return <VideoPlayer media={media} videoRef={videoRef} fullscreen={fullscreen} />;
  }
  return (
    <>
      <Image
        src={media.src} alt={media.alt} fill priority={eager} quality={85}
        sizes={fullscreen ? '100vw' : '(min-width: 1024px) 800px, 100vw'}
        placeholder={media.lqip ? 'blur' : 'empty'} blurDataURL={media.lqip} className="object-contain"
      />
      <PropertyWatermark image={media} />
    </>
  );
}

export function Gallery({ images }: { images: GalleryMedia[] }) {
  const [selected, setActive] = useState(0);
  const active = Math.min(selected, images.length - 1);
  const dialog = useRef<HTMLDialogElement>(null);
  const thumbnails = useRef<HTMLUListElement>(null);
  const mainVideo = useRef<HTMLVideoElement>(null);
  const fullscreenVideo = useRef<HTMLVideoElement>(null);
  const go = (delta: number) => setActive((index) => (Math.min(index, images.length - 1) + delta + images.length) % images.length);

  useEffect(() => {
    const strip = thumbnails.current;
    const thumbnail = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumbnail) return;
    strip.scrollTo({ left: thumbnail.offsetLeft - (strip.clientWidth - thumbnail.clientWidth) / 2, behavior: 'smooth' });
  }, [active]);

  const handleKey = (event: KeyboardEvent) => {
    // Let video and seek controls handle their own keyboard shortcuts.
    if (event.defaultPrevented || (event.target instanceof HTMLElement && event.target.closest('video, input, [data-preset="video"]'))) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      go(event.key === 'ArrowLeft' ? -1 : 1);
    }
  };

  const media = images[active];
  const frame = galleryFrameRatio(images.filter((item) => item.kind !== 'video'));
  const frameStyle = { '--frame': frame, '--frame-phone': Math.min(frame, 16 / 9) } as CSSProperties;
  const openFullscreen = () => {
    mainVideo.current?.pause();
    dialog.current?.showModal();
  };

  return (
    <div>
      <div className="relative aspect-(--frame-phone) overflow-hidden rounded-lg bg-[#141414] sm:aspect-(--frame)" style={frameStyle} role="group" aria-label="Fotos e vídeos do imóvel" onKeyDown={handleKey}>
        {media.kind !== 'video' && media.lqip ? (
          <div aria-hidden className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-75" style={{ backgroundImage: `url("${media.lqip}")` }} />
        ) : null}
        <MediaFrame key={media.src} media={media} videoRef={mainVideo} eager={active === 0} />
        <button type="button" aria-label="Item anterior" onClick={() => go(-1)} className={clsx(control, 'absolute top-1/2 left-3 -translate-y-1/2')}><FaChevronLeft aria-hidden /></button>
        <button type="button" aria-label="Próximo item" onClick={() => go(1)} className={clsx(control, 'absolute top-1/2 right-3 -translate-y-1/2')}><FaChevronRight aria-hidden /></button>
        <button type="button" aria-label="Ver em tela cheia" onClick={openFullscreen} className={clsx(control, 'absolute top-3 right-3')}><FaExpand aria-hidden /></button>
        <span aria-live="polite" className={clsx(pill, 'pointer-events-none absolute top-3 left-3 z-30 tabular-nums')}>{active + 1} / {images.length}{media.kind === 'video' ? ' · Vídeo' : ''}</span>
      </div>

      <ul ref={thumbnails} className="scrollbar-none relative -mx-1 mt-1 flex gap-2 overflow-x-auto overflow-y-hidden p-1">
        {images.map((thumbnail, index) => (
          <li key={thumbnail.key ?? thumbnail.src} className="shrink-0">
            <button type="button" aria-label={`Ver ${thumbnail.kind === 'video' ? 'vídeo' : 'foto'} ${index + 1}: ${thumbnail.alt}`} aria-current={index === active} onClick={() => setActive(index)}
              className={clsx('relative block h-16 w-24 overflow-hidden rounded-lg bg-[#141414] text-white outline-offset-1 transition-opacity duration-150 motion-reduce:transition-none', index === active ? 'ring-2 ring-brand ring-offset-2' : 'opacity-70 hover:opacity-100')}>
              {thumbnail.kind === 'video' ? (
                <>
                  {thumbnail.poster ? <Image src={thumbnail.poster.src} alt="" fill sizes="96px" quality={60} className="object-cover opacity-50" /> : null}
                  <span className="relative flex h-full flex-col items-center justify-center gap-1 text-xs"><FaPlay aria-hidden />Vídeo</span>
                </>
              ) : (
                <><Image src={thumbnail.src} alt="" fill sizes="96px" quality={60} loading="lazy" className="object-cover" /><PropertyWatermark image={thumbnail} /></>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} aria-label="Fotos e vídeos do imóvel em tela cheia" onKeyDown={handleKey} onClose={() => fullscreenVideo.current?.pause()} className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black/95 backdrop:bg-black">
        <div className="relative h-full w-full">
          <MediaFrame key={media.src} media={media} videoRef={fullscreenVideo} fullscreen />
          <button type="button" aria-label="Item anterior" onClick={() => go(-1)} className={clsx(control, 'absolute top-1/2 left-3 -translate-y-1/2')}><FaChevronLeft aria-hidden /></button>
          <button type="button" aria-label="Próximo item" onClick={() => go(1)} className={clsx(control, 'absolute top-1/2 right-3 -translate-y-1/2')}><FaChevronRight aria-hidden /></button>
          <button type="button" aria-label="Fechar" onClick={() => dialog.current?.close()} className={clsx(control, 'absolute top-3 right-3')}><FaXmark aria-hidden /></button>
          <span className={clsx(pill, 'pointer-events-none absolute top-3 left-3 z-30 max-w-[70%] truncate')}>{active + 1} / {images.length} — {media.alt}</span>
        </div>
      </dialog>
    </div>
  );
}
