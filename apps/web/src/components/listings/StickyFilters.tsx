'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Sticks the filter bar under the header. Once stuck, a backdrop fills the strip around the
 * floating header, so results never show through above the bar.
 */
export function StickyFilters({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const update = () => {
      const element = bar.current;
      if (!element) return;
      setStuck(element.getBoundingClientRect().top <= Number.parseFloat(getComputedStyle(element).top) + 0.5);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={bar}
      data-stuck={stuck}
      className="sticky top-(--header-offset) z-20 mt-4 border-y border-line bg-white/95 backdrop-blur [--focus:var(--color-brand)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:hidden before:h-(--header-offset) before:bg-white data-[stuck=true]:border-t-transparent data-[stuck=true]:before:block"
    >
      {children}
    </div>
  );
}
