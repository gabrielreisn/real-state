'use client';

import clsx from 'clsx';
import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaChevronDown } from 'react-icons/fa6';
import { normalize } from '@/lib/property-search';

export type SelectOption = { value: string; label: string; /** A parent in a tree, like a city over its neighborhoods. */ parent?: boolean; /** A child in a tree. */ nested?: boolean };
/** `label` is a visible heading; `name` only names the group for screen readers. */
export type SelectGroup = { label?: string; name?: string; options: SelectOption[] };

type SelectProps = {
  id?: string;
  /** Submits the value with the surrounding form. */
  name?: string;
  groups: SelectGroup[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  'aria-current'?: boolean;
};

const GAP = 6;
const EDGE = 8;

/**
 * A dropdown with the WAI-ARIA select-only combobox keyboard behavior. The list is portaled to
 * the body so scrolling or blurred ancestors, like the filter bar, cannot clip it.
 */
export function Select({ id, name, groups, value, defaultValue = '', onChange, placeholder, required, className, 'aria-current': current }: SelectProps) {
  const baseId = useId();
  const listId = `${baseId}-lista`;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<{ left: number; top: number; minWidth: number } | null>(null);

  const selectedValue = value ?? internal;
  const options = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selected = options.find((option) => option.value === selectedValue);
  const optionId = (index: number) => `${baseId}-opcao-${index}`;

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
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on the stable baseId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function show() {
    setActive(Math.max(0, options.findIndex((option) => option.value === selectedValue)));
    setPosition(null);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    setOpen(false);
    if (!option) return;
    setInternal(option.value);
    if (option.value !== selectedValue) onChange?.(option.value);
  }

  function typeAhead(char: string) {
    const now = Date.now();
    const text = now - typed.current.at > 600 ? char : typed.current.text + char;
    typed.current = { text, at: now };
    const wanted = normalize(text);
    const match = options.findIndex((option) => normalize(option.label).startsWith(wanted));
    if (match !== -1) setActive(match);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!open) show();
      typeAhead(event.key);
      return;
    }
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(active);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <>
      {name ? (
        required ? (
          // Stays a real, invisible field so the browser still asks for a choice before submitting.
          <input aria-hidden tabIndex={-1} name={name} required value={selectedValue} onChange={() => undefined} className="sr-only" />
        ) : (
          <input type="hidden" name={name} value={selectedValue} />
        )
      ) : null}
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-current={current}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        className={className}
      >
        <span className={clsx('min-w-0 truncate', !selected && 'text-slate')}>{selected?.label ?? placeholder}</span>
        <FaChevronDown aria-hidden className={clsx('shrink-0 text-[0.7em] transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')} />
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              style={position ? { left: position.left, top: position.top, minWidth: position.minWidth } : { left: 0, top: 0, visibility: 'hidden' }}
              // Keeps focus on the button, so its blur doesn't close the list before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              className="fixed z-40 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl bg-white text-ink shadow-2xl ring-1 ring-navy/10"
            >
              <div id={listId} role="listbox" className="max-h-80 overflow-y-auto overscroll-contain p-1.5">
                {groups.map((group, groupIndex) => (
                  <div key={group.label ?? group.name ?? groupIndex} role="group" aria-label={group.label ?? group.name} className={clsx(group.name && groupIndex > 0 && 'mt-1 border-t border-line pt-1')}>
                    {group.label ? <div className="px-3 pt-2.5 pb-1 text-xs font-semibold tracking-wide text-slate uppercase">{group.label}</div> : null}
                    {group.options.map((option) => {
                      const optionIndex = options.indexOf(option);
                      const isSelected = option.value === selectedValue;
                      return (
                        <div
                          key={option.value}
                          id={optionId(optionIndex)}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => choose(optionIndex)}
                          onMouseEnter={() => setActive(optionIndex)}
                          className={clsx('flex cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-2 whitespace-nowrap', optionIndex === active && 'bg-mist', isSelected && 'font-semibold', option.parent && 'font-bold', option.nested && 'pl-7')}
                        >
                          {option.label}
                          {isSelected ? <FaCheck aria-hidden className="shrink-0 text-xs text-brand" /> : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
