import Link from 'next/link';
import { getSiteSettings } from '@/content';

// Text stand-in that echoes the current logo's navy and gold. Swap in the original artwork when available.
export async function Logo() {
  const site = await getSiteSettings();
  return (
    <Link
      href="/"
      aria-label={`${site.brandName}, página inicial`}
      className="flex h-14 shrink-0 flex-col justify-center rounded-sm bg-navy px-3 text-gold [--focus:var(--color-brand)]"
    >
      <span className="text-lg leading-none font-bold tracking-wide">{site.brandName}</span>
      <span className="mt-1 text-[11px] leading-none">Creci/ES {site.creci}</span>
    </Link>
  );
}
