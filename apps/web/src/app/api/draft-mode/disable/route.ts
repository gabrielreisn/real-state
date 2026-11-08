import { draftMode } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/** Leaves preview mode and goes back to the page the editor was on (same-site paths only). */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const back = request.nextUrl.searchParams.get('voltar');
  const path = back?.startsWith('/') && !back.startsWith('//') ? back : '/';
  return NextResponse.redirect(new URL(path, request.url));
}
