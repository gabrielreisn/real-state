/**
 * Shared pieces for generated Open Graph images (1200×630). next/og renders a subset of CSS:
 * flexbox only, and every element with several children needs display: flex.
 */
import type { ReactNode } from 'react';
import { withImageParams } from '@/lib/sanity/url';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/**
 * A listing photo as a share image: JPEG from the Sanity CDN, cropped to 1200×630, usually around
 * 100 KB. Generated PNG cards with photos weigh 1 MB or more, and WhatsApp previews (the main way
 * listings get shared) fail for heavy images.
 */
export const ogPhoto = (src: string, width = 1200, height = 630) => withImageParams(src, { w: width, h: height, fit: 'crop', fm: 'jpg', q: 75 });

export const ogPhotoImage = (src: string, alt: string) => ({ url: ogPhoto(src), width: 1200, height: 630, alt, type: 'image/jpeg' });

export function Brand({ creci }: { creci: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#0f1a3a', color: '#e0ac69', fontSize: 28, fontWeight: 700 }}>
        AN
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>Alex Nolasco</div>
        <div style={{ fontSize: 20, opacity: 0.8 }}>{`Consultor Imobiliário · Creci/ES ${creci}`}</div>
      </div>
    </div>
  );
}

/** Navy card with a heading, used by pages without a photo of their own. */
export function TextCard({ eyebrow, title, footer, creci }: { eyebrow?: string; title: string; footer?: ReactNode; creci: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#0f1a3a', color: '#ffffff' }}>
      <div style={{ display: 'flex', color: '#ffffff' }}>
        <Brand creci={creci} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {eyebrow ? <div style={{ fontSize: 30, color: '#e0ac69' }}>{eyebrow}</div> : null}
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{title}</div>
      </div>
      <div style={{ display: 'flex', fontSize: 26, color: '#c3cce0' }}>{footer ?? 'alexnolasco.com.br'}</div>
    </div>
  );
}
