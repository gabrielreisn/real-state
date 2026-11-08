import { getMenuPages, getPropertyTypes, getSiteSettings } from '@/content';
import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { StickyHeader } from './StickyHeader';

export async function Header() {
  const [types, pages, { phone, whatsapp }] = await Promise.all([getPropertyTypes(), getMenuPages(), getSiteSettings()]);
  return (
    <StickyHeader>
      <div className="mx-auto flex h-full max-w-7xl items-center gap-8 px-4 transition-[padding] duration-300 md:px-8 md:group-data-[compact=true]/header:px-4">
        <Logo />
        <Navigation types={types} pages={pages} phone={phone} whatsapp={whatsapp} />
      </div>
    </StickyHeader>
  );
}
