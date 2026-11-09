import Image from 'next/image';
import type { Image as PropertyImage } from '@/content/types';

/** A non-destructive mark: editors can swap the site setting without touching the property photo. */
export function PropertyWatermark({ image }: { image: PropertyImage }) {
  if (!image.watermark) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute right-3 bottom-3 z-10 h-[22%] w-[28%]">
      <Image src={image.watermark} alt="" fill sizes="28vw" className="object-contain object-right-bottom" />
    </span>
  );
}
