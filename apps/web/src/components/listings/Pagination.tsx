import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

/** Page numbers to show: first, last, and the current page with its neighbours. */
function pageWindow(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
  return [...pages].sort((a, b) => a - b);
}

const box = 'flex h-11 min-w-11 items-center justify-center rounded-full px-3 font-medium';

export function Pagination({ current, total, href }: { current: number; total: number; href: (page: number) => string }) {
  if (total <= 1) return null;
  const pages = pageWindow(current, total);

  return (
    <nav aria-label="Páginas de resultados" className="mt-14 flex items-center justify-center gap-1">
      {current > 1 ? (
        <Link href={href(current - 1)} rel="prev" aria-label="Página anterior" className={`${box} hover:bg-mist`}>
          <FaChevronLeft aria-hidden />
        </Link>
      ) : null}
      {pages.map((page, index) => (
        <span key={page} className="flex items-center gap-1">
          {index > 0 && page - pages[index - 1] > 1 ? <span className="px-1 text-slate">…</span> : null}
          {page === current ? (
            <span aria-current="page" className={`${box} bg-navy text-white`}>
              {page}
            </span>
          ) : (
            <Link href={href(page)} className={`${box} hover:bg-mist`}>
              {page}
            </Link>
          )}
        </span>
      ))}
      {current < total ? (
        <Link href={href(current + 1)} rel="next" aria-label="Próxima página" className={`${box} hover:bg-mist`}>
          <FaChevronRight aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
