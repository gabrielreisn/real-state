import { NextResponse, type NextRequest } from 'next/server';
import { legacyRedirect } from './lib/redirects/legacy-url';

export function proxy(request: NextRequest) {
  const target = legacyRedirect(new URL(request.url));
  return target ? NextResponse.redirect(target, 308) : NextResponse.next();
}

export const config = {
  matcher: [
    '/imovel/:path*',
    '/mobile/imovel/:path*',
    '/mobile/imoveis/:path*',
    { source: '/((?!api|_next|.*\\..*).*)', has: [{ type: 'query', key: 'amp' }] },
  ],
};
