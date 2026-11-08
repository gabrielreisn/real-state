import { EyeOpenIcon } from '@sanity/icons/EyeOpen';
import { useEffect } from 'react';
import type { DocumentActionComponent } from 'sanity';
import { useRouter } from 'sanity/router';
import { documentLocations, type PathFields } from '../presentation';
import { clearPreviewTarget, setPreviewTarget, type PreviewTarget } from '../preview-target';

/** Opens Pré-visualização on a document's page, with the document in the editor beside it. */
export function openPreview(router: ReturnType<typeof useRouter>, { id, type, href }: PreviewTarget) {
  router.navigateIntent('edit', { id, type, mode: 'presentation', presentation: 'presentation', preview: href });
}

/**
 * "Pré-visualizar no site": opens the document's own page (a listing opens its listing page, not
 * the home page). It also tells the "Pré-visualização" tab which document is open, so the tab
 * does the same. Hidden when the document has no page yet.
 */
export const previewAction: DocumentActionComponent = ({ id, type, draft, published }) => {
  const router = useRouter();
  const doc = (draft ?? published ?? {}) as Omit<PathFields, 'slug'> & { slug?: { current?: string } };
  const href = documentLocations(type, { ...doc, slug: doc.slug?.current })[0]?.href;

  useEffect(() => {
    if (!href) return clearPreviewTarget(id);
    setPreviewTarget({ id, type, href });
    return () => clearPreviewTarget(id);
  }, [id, type, href]);

  if (!href) return null;
  return {
    label: 'Pré-visualizar no site',
    icon: EyeOpenIcon,
    onHandle: () => openPreview(router, { id, type, href }),
  };
};
