import Link from 'next/link';
import type { ComponentProps } from 'react';

// Listings without a page here yet open on the live site in a new tab.
export function PropertyLink({ href, children, ...props }: ComponentProps<'a'> & { href: string }) {
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
