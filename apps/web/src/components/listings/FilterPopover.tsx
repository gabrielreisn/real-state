'use client';

import clsx from 'clsx';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown } from 'react-icons/fa6';
import { useAnchoredPosition } from '@/components/ui/useAnchoredPosition';

type FilterPopoverProps = {
  label: string;
  /** What the pill shows: the current selection, or the filter's name. */
  summary: string;
  active: boolean;
  /** The button's text, with the live result count. */
  applyLabel: string;
  onApply: () => void;
  onCancel: () => void;
  onClear: () => void;
  /** Lets long lists scroll while the buttons stay visible. */
  scrolls?: boolean;
  className: string;
  children: ReactNode;
};

/** A pill that opens a panel of choices. Leaving the panel keeps them; Escape discards them. */
export function FilterPopover({ label, summary, active, applyLabel, onApply, onCancel, onClear, scrolls, className, children }: FilterPopoverProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const position = useAnchoredPosition(open, trigger, panel);
  const placed = position !== null;

  const apply = () => {
    setOpen(false);
    onApply();
  };
  const latestApply = useRef(apply);
  useEffect(() => {
    latestApply.current = apply;
  });

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) latestApply.current();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (placed) panel.current?.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true });
  }, [placed]);

  return (
    <>
      <button ref={trigger} type="button" aria-expanded={open} aria-haspopup="dialog" aria-label={`${label}: ${summary}`} aria-current={active} onClick={() => (open ? apply() : setOpen(true))} className={className}>
        <span className="min-w-0 truncate">{summary}</span>
        <FaChevronDown aria-hidden className={clsx('shrink-0 text-[0.7em] transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')} />
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              role="dialog"
              aria-label={label}
              style={position ? { left: position.left, top: position.top } : { left: 0, top: 0, visibility: 'hidden' }}
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                event.stopPropagation();
                setOpen(false);
                onCancel();
                trigger.current?.focus();
              }}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (next && !panel.current?.contains(next) && !trigger.current?.contains(next)) apply();
              }}
              className="fixed z-40 flex w-[23rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl bg-white text-ink shadow-2xl ring-1 ring-navy/10 [--focus:var(--color-brand)]"
            >
              <div className={scrolls ? 'max-h-[min(24rem,55vh)] overflow-y-auto overscroll-contain px-3 pb-3' : 'p-3'}>{children}</div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
                <button type="button" onClick={onClear} className="text-sm font-semibold underline underline-offset-4 hover:text-brand">
                  Limpar
                </button>
                <button type="button" onClick={apply} className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-brand-dark">
                  {applyLabel}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
