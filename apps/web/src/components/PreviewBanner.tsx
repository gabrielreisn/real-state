'use client';

import { useIsPresentationTool } from 'next-sanity/hooks';
import { usePathname } from 'next/navigation';

/**
 * Shown while preview mode is on outside the Studio (e.g. a shared preview link), so drafts are
 * never mistaken for the live site. Inside the Presentation tool the Studio has its own controls.
 */
export function PreviewBanner() {
  const inPresentation = useIsPresentationTool();
  const pathname = usePathname();
  if (inPresentation !== false) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center whitespace-nowrap gap-3 rounded-full bg-navy py-2 pr-2 pl-4 text-sm text-white shadow-lg">
      <span>Pré-visualização: rascunhos visíveis</span>
      {/* A plain link: a prefetched Next link would leave preview mode just by rendering. */}
      <a href={`/api/draft-mode/disable?voltar=${encodeURIComponent(pathname)}`} className="rounded-full bg-white px-3 py-1 font-semibold text-navy hover:bg-mist">
        Sair
      </a>
    </div>
  );
}
