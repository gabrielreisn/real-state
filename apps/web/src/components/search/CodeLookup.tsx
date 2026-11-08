'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';
import { LISTINGS_PATH } from '@/lib/listings-url';

/** Opens a listing straight from the code printed on a flyer, sign or ad. */
export function CodeLookup({ listings }: { listings: { code: string; href: string }[] }) {
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('codigo') ?? '').trim().replace(/^#/, '');
    if (!code) return setError('Digite o código que aparece no anúncio.');

    const listing = listings.find((candidate) => candidate.code === code);
    if (!listing) return setError(`Nenhum anúncio com o código ${code}. Confira o número e tente de novo.`);

    setError(null);
    router.push(listing.href);
  }

  return (
    <form action={LISTINGS_PATH} method="get" onSubmit={handleSubmit} className="mt-10 border-t border-white/20 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={id} className="text-on-navy">
          Já tem o código do anúncio?
        </label>
        <div className="flex">
          <input
            id={id}
            name="codigo"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex.: 1170"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-erro` : undefined}
            className="w-32 bg-white px-3 py-2 text-ink placeholder:text-slate"
          />
          <button type="submit" className="border border-white px-4 py-2 font-semibold hover:bg-white hover:text-navy">
            Abrir anúncio
          </button>
        </div>
      </div>
      <p id={`${id}-erro`} aria-live="polite" className="mt-2 min-h-6 text-white">
        {error}
      </p>
    </form>
  );
}
