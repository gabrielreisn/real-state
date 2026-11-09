import { draftMode } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getPropertyDetailParams } from '@/content';
import { recordPropertyView } from '@/lib/property-views';

const CRAWLER = /bot|crawl|spider|slurp|lighthouse|headless/i;

/** Counts one visit to a listing page. Crawlers, editors in preview mode and unknown listings do not count. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [{ id }, preview, listings] = await Promise.all([params, draftMode(), getPropertyDetailParams()]);
  const fromThisSite = request.headers.get('sec-fetch-site') === 'same-origin';
  const person = fromThisSite && !CRAWLER.test(request.headers.get('user-agent') ?? '');
  if (person && !preview.isEnabled && listings.some((listing) => listing.id === id)) await recordPropertyView(id);
  return new NextResponse(null, { status: 204 });
}
