import { useSyncExternalStore } from 'react';

/** The open document's page on the site, which the "Pré-visualização" tab opens. */
export type PreviewTarget = { id: string; type: string; href: string };

let current: PreviewTarget | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function setPreviewTarget(target: PreviewTarget) {
  current = target;
  emit();
}

/** Clears the target when its document closes, unless another document has taken over since. */
export function clearPreviewTarget(id: string) {
  if (current?.id !== id) return;
  current = null;
  emit();
}

export function usePreviewTarget() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
