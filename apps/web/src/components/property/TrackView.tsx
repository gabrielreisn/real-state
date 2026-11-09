'use client';

import { useEffect } from 'react';

/** Reports a visit to this listing, once per browser session. Renders nothing. */
export function TrackView({ id }: { id: string }) {
  useEffect(() => {
    const key = `visto:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage can be blocked; the visit still counts, at worst more than once.
    }
    navigator.sendBeacon(`/api/imoveis/${encodeURIComponent(id)}/view`);
  }, [id]);
  return null;
}
