import { NextResponse, type NextRequest } from 'next/server';
import { getPropertyDetail, getSiteSettings } from '@/content';
import { propertyWhatsappLink } from '@/lib/property-whatsapp';

// A short QR payload scans easily. Resolve the current listing and contact details on each scan.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, site] = await Promise.all([getPropertyDetail(id), getSiteSettings()]);
  if (!property) return new NextResponse('Imóvel não encontrado.', { status: 404 });
  return NextResponse.redirect(propertyWhatsappLink(site.whatsapp, property, request.nextUrl.origin));
}
