import { visionTool } from '@sanity/vision';
import { defineConfig, type WorkspaceOptions } from 'sanity';
import { presentationTool } from 'sanity/presentation';
import { structureTool } from 'sanity/structure';
import { previewAction } from './actions/preview';
import { resolve } from './presentation';
import { schemaTypes } from './schemas';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? '1ai1aq1e';

/**
 * One workspace per dataset. Each previews the website that reads that dataset:
 * production is the deployed site, development is the site running locally (`pnpm dev:web`).
 */
function workspace({ dataset, title, subtitle, previewUrl }: { dataset: string; title: string; subtitle: string; previewUrl: string }): WorkspaceOptions {
  return {
    name: dataset,
    basePath: `/${dataset}`,
    title,
    subtitle,
    projectId,
    dataset,
    plugins: [
      structureTool({ structure }),
      presentationTool({
        title: 'Pré-visualização',
        resolve,
        previewUrl: { initial: previewUrl, previewMode: { enable: '/api/draft-mode/enable' } },
        // Any local port, so the preview also works when the site runs on another one.
        allowOrigins: previewUrl.startsWith('http://localhost') ? ['http://localhost:*'] : [previewUrl],
      }),
      visionTool(),
    ],
    schema: {
      types: schemaTypes,
      // Keep the singleton out of "create new document" menus.
      // The singleton and website submissions are never created from inside Studio.
      templates: (templates) => templates.filter(({ schemaType }) => !['siteSettings', 'propertySubmission'].includes(schemaType)),
    },
    document: {
      actions: (actions, { schemaType }) => {
        if (schemaType === 'propertySubmission') return actions.filter(({ action }) => action !== 'duplicate');
        const allowed = schemaType === 'siteSettings' ? actions.filter(({ action }) => action !== 'duplicate' && action !== 'delete') : actions;
        // Right after Publish, at the top of the "…" menu next to it.
        return [...allowed.slice(0, 1), previewAction, ...allowed.slice(1)];
      },
    },
  };
}

export default defineConfig([
  workspace({
    dataset: 'production',
    title: 'Alex Nolasco Imóveis',
    subtitle: 'Produção',
    // Change to https://www.alexnolasco.com.br at launch (or set SANITY_STUDIO_PRODUCTION_URL before deploying the Studio).
    previewUrl: process.env.SANITY_STUDIO_PRODUCTION_URL ?? 'https://real-state-one-smoky.vercel.app',
  }),
  workspace({
    dataset: 'development',
    title: 'Alex Nolasco Imóveis',
    subtitle: 'Desenvolvimento',
    previewUrl: process.env.SANITY_STUDIO_DEVELOPMENT_URL ?? 'http://localhost:3000',
  }),
]);
