import { EyeOpenIcon } from '@sanity/icons/EyeOpen';
import type { DocumentActionComponent } from 'sanity';
import { useRouter } from 'sanity/router';
import { documentLocations, type PathFields } from '../presentation';

/**
 * Opens Pré-visualização on the document's own page (a listing opens its listing page, not the
 * home page), with the document in the editor beside it. Hidden when the document has no page yet.
 */
export const previewAction: DocumentActionComponent = ({ id, type, draft, published }) => {
  const router = useRouter();
  const doc = (draft ?? published ?? {}) as Omit<PathFields, 'slug'> & { slug?: { current?: string } };
  const [location] = documentLocations(type, { ...doc, slug: doc.slug?.current });
  if (!location) return null;
  return {
    label: 'Pré-visualizar no site',
    icon: EyeOpenIcon,
    onHandle: () => router.navigateIntent('edit', { id, type, mode: 'presentation', presentation: 'presentation', preview: location.href }),
  };
};
