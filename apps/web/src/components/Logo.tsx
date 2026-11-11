import Link from 'next/link';
import Image from 'next/image';
import { getSiteSettings } from '@/content';

export async function Logo() {
  const site = await getSiteSettings();
  return (
    <Link
      href="/"
      aria-label={`${site.brandName}, página inicial`}
      className={`flex shrink-0 flex-col justify-center rounded-sm text-gold transition-[height,border-radius] duration-300 ease-out [--focus:var(--color-brand)] motion-reduce:transition-none ${site.logo ? 'h-16 group-data-[compact=true]/header:h-12' : 'h-14 bg-navy px-3 group-data-[compact=true]/header:h-11 group-data-[compact=true]/header:rounded-lg'}`}
    >
      {site.logo ? (
        <Image
          src={site.logo.src}
          alt={site.logo.alt || site.brandName}
          width={site.logo.width ?? 500}
          height={site.logo.height ?? 500}
          sizes="(max-width: 768px) 64px, 160px"
          preload
          className="h-full w-auto max-w-40 object-contain rounded-lg"
        />
      ) : (
        <>
          <span className="text-lg leading-none font-bold tracking-wide">{site.brandName}</span>
          <span className="mt-1 text-[11px] leading-none">Creci/ES {site.creci}</span>
        </>
      )}
    </Link>
  );
}
