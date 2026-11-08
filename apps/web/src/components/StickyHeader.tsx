'use client';

import { type ReactNode, useEffect, useState } from 'react';

/**
 * Keeps the header on screen and, once the page scrolls, turns it into a smaller floating bar
 * with rounded corners. The outer box never changes height, so the page below does not jump;
 * only the bar inside it shrinks.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      data-compact={compact}
      className="group/header pointer-events-none sticky top-0 z-30 h-(--header-offset) transition-[padding] duration-300 ease-out data-[compact=true]:px-3 motion-reduce:transition-none md:data-[compact=true]:px-6"
    >
      <div className="pointer-events-auto relative mx-auto h-full max-w-full border-b border-line bg-white transition-all duration-300 ease-out group-data-[compact=true]/header:mt-2 group-data-[compact=true]/header:h-16 group-data-[compact=true]/header:max-w-7xl group-data-[compact=true]/header:rounded-2xl group-data-[compact=true]/header:border group-data-[compact=true]/header:border-line/70 group-data-[compact=true]/header:bg-white/90 group-data-[compact=true]/header:shadow-[0_8px_30px_-12px_rgb(15_26_58/0.35)] group-data-[compact=true]/header:backdrop-blur-md has-[#menu-movel:not([hidden])]:bg-white! motion-reduce:transition-none">
        {children}
      </div>
    </header>
  );
}
