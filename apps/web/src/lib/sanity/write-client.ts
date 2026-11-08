import { createClient } from '@sanity/client';
import { sanityConfig } from './client';

/**
 * Write access to Sanity. Only import this from server code (server actions, route handlers):
 * the token must never reach the browser.
 */
export function sanityWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is not set; the website cannot save form submissions.');
  return createClient({ ...sanityConfig, apiVersion: '2025-02-19', token, useCdn: false });
}
