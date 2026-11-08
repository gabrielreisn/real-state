import { defineEnableDraftMode } from 'next-sanity/draft-mode';
import { client, readToken } from '@/lib/sanity/client';

// The Studio's Presentation tool calls this with a one-time secret it stored in the dataset; the
// handler checks the secret with the read token, switches Draft Mode on and redirects to the page.
const enable = readToken ? defineEnableDraftMode({ client: client.withConfig({ token: readToken }) }) : null;

export function GET(request: Request) {
  if (!enable) return new Response('Preview is not configured: set SANITY_API_READ_TOKEN.', { status: 501 });
  return enable.GET(request);
}
