import { type RefObject, useLayoutEffect, useState } from 'react';

const GAP = 6;
const EDGE = 8;

/** Keeps a fixed panel next to its trigger, flipping above it or shifting left when it would leave the screen. */
export function useAnchoredPosition(open: boolean, trigger: RefObject<HTMLElement | null>, panel: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<{ left: number; top: number; minWidth: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const { offsetWidth: width, offsetHeight: height } = panel.current;
      const fitsBelow = anchor.bottom + GAP + height <= window.innerHeight - EDGE;
      const top = fitsBelow || anchor.top < height + GAP ? anchor.bottom + GAP : anchor.top - GAP - height;
      const left = Math.max(EDGE, Math.min(anchor.left, document.documentElement.clientWidth - width - EDGE));
      setPosition({ left, top, minWidth: anchor.width });
    };
    place();
    window.addEventListener('scroll', place, { capture: true, passive: true });
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, { capture: true });
      window.removeEventListener('resize', place);
    };
  }, [open, trigger, panel]);

  return open ? position : null;
}
