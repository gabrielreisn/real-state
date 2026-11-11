import { NextResponse, type NextRequest } from 'next/server';
import { isPropertyUnavailable } from '@/content/availability';

// Returning before rendering is required for a real 404, including when a previously available
// page is cached. notFound() during a streamed response can only add noindex to an HTTP 200.
export async function proxy(request: NextRequest) {
  const code = decodeURIComponent(request.nextUrl.pathname.split('/')[2]);
  if (!await isPropertyUnavailable(code)) return NextResponse.next();
  return new NextResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Imóvel indisponível | Alex Nolasco Imóveis</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;color:#0f1a3a"><main style="min-height:100vh;display:grid;place-content:center;text-align:center;padding:24px"><p style="font-size:18px">404</p><h1>Imóvel indisponível</h1><p>Este imóvel não está mais disponível.</p><a href="/imoveis" style="color:#ac0808;font-weight:600">Ver imóveis disponíveis</a></main></body></html>`, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
  });
}

export const config = { matcher: '/imovel/:id/:slug' };
