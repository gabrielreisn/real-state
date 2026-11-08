'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaBars, FaChevronDown, FaWhatsapp, FaXmark } from 'react-icons/fa6';
import { phoneLink, whatsappLink } from '@/content/site';
import type { MenuPage } from '@/content/types';
import { listingsHref } from '@/lib/listings-url';

type NavLink = { label: string; href: string };

function NavItemLink({ link, onNavigate, className }: { link: NavLink; onNavigate: () => void; className: string }) {
  if (link.href.startsWith('http')) {
    return (
      <a href={link.href} onClick={onNavigate} className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      {link.label}
    </Link>
  );
}

export function Navigation({
  types,
  pages,
  phone,
  whatsapp,
}: {
  types: string[];
  pages: MenuPage[];
  phone: string;
  whatsapp: string;
}) {
  const groups = [
    {
      label: 'Imóveis',
      links: [{ label: 'Todos à venda', href: listingsHref({}) }, ...types.map((type) => ({ label: type, href: listingsHref({ tipo: type }) }))],
    },
    { label: 'Informações', links: pages.map((page) => ({ label: page.title, href: `/${page.slug}` })) },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  const hovering = useRef(false);
  const closeTimer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!openGroup) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenGroup(null);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openGroup]);

  // While the mobile menu is open the page behind it stays put, and the menu scrolls on its own.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 48rem)');
    const closeOnDesktop = () => desktop.matches && setMenuOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    desktop.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      root.style.overflow = previous;
      desktop.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const closeAll = () => {
    setOpenGroup(null);
    setMenuOpen(false);
  };

  return (
    <nav ref={nav} aria-label="Principal" className="flex flex-1 items-center justify-between gap-6">
      <ul className="hidden items-center gap-1 md:flex">
        {groups.filter((group) => group.links.length > 0).map((group) => {
          const open = openGroup === group.label;
          return (
            <li
              key={group.label}
              className="relative"
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return;
                hovering.current = true;
                window.clearTimeout(closeTimer.current);
                setOpenGroup(group.label);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== 'mouse') return;
                hovering.current = false;
                closeTimer.current = window.setTimeout(() => setOpenGroup(null), 150);
              }}
            >
              <button
                type="button"
                aria-expanded={open}
                // A mouse click lands after hover has already opened the menu, so it must not close it.
                onClick={() => setOpenGroup(open && !hovering.current ? null : group.label)}
                className="flex items-center gap-1.5 px-3 py-2 font-medium hover:text-brand"
              >
                {group.label}{' '}
                <FaChevronDown aria-hidden className={`text-[10px] transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
              </button>
              {/* Padding rather than margin: the pointer stays inside the <li> on its way down to the panel. */}
              <div
                className={`absolute top-full left-0 pt-2 transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}
              >
                <ul className="max-h-[calc(100dvh-var(--header-offset)-1.5rem)] w-64 overflow-y-auto overscroll-contain rounded-2xl border border-line/70 bg-white p-2 shadow-[0_18px_40px_-18px_rgb(15_26_58/0.35)]">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <NavItemLink
                        link={link}
                        onNavigate={closeAll}
                        className="block rounded-lg px-3 py-2 text-slate transition-colors duration-150 hover:bg-mist hover:text-navy motion-reduce:transition-none"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
        <li>
          <a href="#contato" className="block px-3 py-2 font-medium hover:text-brand">
            Contato
          </a>
        </li>
      </ul>

      <div className="hidden items-center gap-5 md:flex">
        <a href={phoneLink(whatsapp)} className="font-semibold tabular-nums hover:underline">
          {phone}
        </a>
        <a
          href={whatsappLink(whatsapp, 'Olá! Vim pelo site e gostaria de mais informações.')}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          <FaWhatsapp aria-hidden className="text-lg" /> WhatsApp
        </a>
      </div>

      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="menu-movel"
        onClick={() => setMenuOpen((value) => !value)}
        className="ml-auto flex items-center gap-2 px-2 py-2 font-semibold md:hidden"
      >
        {menuOpen ? <FaXmark aria-hidden /> : <FaBars aria-hidden />} Menu
      </button>

      {/* The compact header's backdrop blur would trap a fixed child, so the dimmed backdrop lives on <body>. */}
      {menuOpen
        ? createPortal(<div aria-hidden onClick={closeAll} className="animate-fade-in fixed inset-0 z-20 bg-navy/40 md:hidden" />, document.body)
        : null}

      <div
        id="menu-movel"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--header-offset))] overflow-y-auto overscroll-contain border-b border-line bg-white px-4 pb-6 shadow-lg md:hidden group-data-[compact=true]/header:mt-2 group-data-[compact=true]/header:max-h-[calc(100dvh-var(--header-offset)-0.75rem)] group-data-[compact=true]/header:rounded-2xl group-data-[compact=true]/header:border"
      >
        {groups.filter((group) => group.links.length > 0).map((group) => (
          <div key={group.label} className="border-b border-line py-3">
            <p className="py-1 font-semibold">{group.label}</p>
            <ul>
              {group.links.map((link) => (
                <li key={link.label}>
                  <NavItemLink link={link} onNavigate={closeAll} className="block py-2 text-slate" />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <a href="#contato" onClick={closeAll} className="block border-b border-line py-4 font-semibold">
          Contato
        </a>
        <a href={phoneLink(whatsapp)} className="mt-4 block text-lg font-semibold tabular-nums">
          {phone}
        </a>
      </div>
    </nav>
  );
}
