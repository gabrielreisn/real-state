/** Metadata and share images must point to this app, not the separate legacy website. */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const deploymentHost = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  const url = env.SITE_URL || (deploymentHost ? `https://${deploymentHost}` : 'http://localhost:3000');
  return url.replace(/\/+$/, '');
}
