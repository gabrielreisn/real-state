import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';
import { structure } from './structure';

export default defineConfig({
  name: 'default',
  title: 'Alex Nolasco Imóveis',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '1ai1aq1e',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'development',
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Keep the singleton out of "create new document" menus.
    templates: (templates) => templates.filter(({ schemaType }) => schemaType !== 'siteSettings'),
  },
  document: {
    actions: (actions, { schemaType }) =>
      schemaType === 'siteSettings' ? actions.filter(({ action }) => action !== 'duplicate' && action !== 'delete') : actions,
  },
});
