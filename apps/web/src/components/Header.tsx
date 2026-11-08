import { getMenuPages, getPropertyTypes, getSiteSettings } from '@/content';
import { Logo } from './Logo';
import { Navigation } from './Navigation';

export async function Header() {
  const [types, pages, { phone, whatsapp }] = await Promise.all([getPropertyTypes(), getMenuPages(), getSiteSettings()]);
  return (
    <header className="relative z-30 border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 md:px-8">
        <Logo />
        <Navigation types={types} pages={pages} phone={phone} whatsapp={whatsapp} />
      </div>
    </header>
  );
}
