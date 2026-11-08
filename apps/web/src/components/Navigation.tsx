'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
            <li key={group.label} className="relative">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenGroup(open ? null : group.label)}
                className="flex items-center gap-1.5 px-3 py-2 font-medium hover:text-brand"
              >
                {group.label} <FaChevronDown aria-hidden className={`text-[10px] ${open ? 'rotate-180' : ''}`} />
              </button>
              {open ? (
                <ul className="absolute top-full left-0 mt-1 w-64 border border-line bg-white py-2 shadow-lg">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <NavItemLink link={link} onNavigate={closeAll} className="block px-4 py-2 hover:bg-mist" />
                    </li>
                  ))}
                </ul>
              ) : null}
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

      <div id="menu-movel" hidden={!menuOpen} className="absolute inset-x-0 top-full border-b border-line bg-white px-4 pb-6 shadow-lg md:hidden">
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
