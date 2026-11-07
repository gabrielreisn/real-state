import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '1ai1aq1e',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'development',
  },
  // Hosted at https://alexnolasco.sanity.studio after `pnpm --filter studio deploy`.
  studioHost: 'alexnolasco',
});
