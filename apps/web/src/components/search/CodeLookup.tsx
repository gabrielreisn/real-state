'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';
import { useSearch } from './SearchProvider';

/** Opens a listing straight from the code printed on a flyer, sign or ad. */
export function CodeLookup() {
  const { meta } = useSearch();
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('codigo') ?? '').trim();
    if (!code) return setError('Digite o código que aparece no anúncio.');

    const property = meta.findByCode(code);
    if (!property) return setError(`Nenhum anúncio com o código ${code}. Confira o número e tente de novo.`);

    setError(null);
    if (property.href.startsWith('http')) window.location.assign(property.href);
    else router.push(property.href);
  }

  return (
    <form action="/#imoveis" method="get" onSubmit={handleSubmit} className="mt-10 border-t border-white/20 pt-6">
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
