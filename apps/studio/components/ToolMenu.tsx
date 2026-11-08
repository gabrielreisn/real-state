import type { MouseEvent } from 'react';
import type { ToolMenuProps } from 'sanity';
import { useRouter } from 'sanity/router';
import { openPreview } from '../actions/preview';
import { usePreviewTarget } from '../preview-target';

const PRESENTATION = 'presentation';

// Tool tabs are links to /<workspace>/<tool>/…; this finds the Pré-visualização one.
const isPresentationLink = (element: EventTarget) => {
  const link = element instanceof Element ? element.closest('a') : null;
  return link !== null && new URL(link.href).pathname.split('/')[2] === PRESENTATION;
};

/**
 * Sanity's own tab bar, except the "Pré-visualização" tab: it opens the open document's page
 * (like the "Pré-visualizar no site" action) and is disabled while no document is open, instead
 * of always opening the home page.
 */
export function ToolMenu(props: ToolMenuProps) {
  const router = useRouter();
  const target = usePreviewTarget();
  const inPresentation = props.activeToolName === PRESENTATION;
  const disabled = !target && !inPresentation;

  const onClickCapture = (event: MouseEvent) => {
    if (inPresentation || !isPresentationLink(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (target) {
      openPreview(router, target);
      props.closeSidebar();
    }
  };

  return (
    <div data-preview-menu={disabled ? 'disabled' : 'enabled'} onClickCapture={onClickCapture} style={{ display: 'contents' }}>
      <style>{`
        [data-preview-menu='disabled'] a[href*='/${PRESENTATION}'] { opacity: 0.4; cursor: not-allowed; }
      `}</style>
      {props.renderDefault(props)}
    </div>
  );
}
