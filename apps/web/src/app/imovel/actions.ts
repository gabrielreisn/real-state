'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getPropertyDetail, getSiteSettings, SITE_URL } from '@/content';
import { validateLead, sendLeadEmail } from '@/lib/lead-email';
import { allowLead } from '@/lib/lead-rate-limit';

// On error the submitted values come back, because React resets the form after an action.
export type LeadFormState =
  | { status: 'idle' | 'success' }
  | { status: 'error'; message: string; values: Record<string, string> };

const field = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === 'string' ? value : undefined;
};

const valuesOf = (data: FormData) => ({
  name: field(data, 'name') ?? '',
  email: field(data, 'email') ?? '',
  phone: field(data, 'phone') ?? '',
  message: field(data, 'message') ?? '',
});

export async function submitLead(_previous: LeadFormState, data: FormData): Promise<LeadFormState> {
  // Bots that fill the honeypot see a normal success and have no reason to retry.
  if (field(data, 'website')) return { status: 'success' };

  const lead = validateLead(data);
  if (!lead) return { status: 'error', message: 'Confira os dados informados, principalmente o telefone com DDD.', values: valuesOf(data) };

  try {
    const requestHeaders = await headers();
    const ip = requestHeaders.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
      || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!await allowLead(ip)) return { status: 'error', message: 'Você enviou várias mensagens. Aguarde alguns minutos antes de tentar novamente.', values: valuesOf(data) };
    const [property, site] = await Promise.all([getPropertyDetail(lead.propertyCode), getSiteSettings()]);
    if (!property) return { status: 'error', message: 'Este imóvel não está disponível. Atualize a página e tente novamente.', values: valuesOf(data) };
    // A repeated submission within ten minutes uses the same key and email body.
    const bucket = Math.floor(Date.now() / 600_000);
    const idempotencyKey = createHash('sha256').update(JSON.stringify({ lead, bucket })).digest('hex');
    await sendLeadEmail({
      lead, property, site: { name: site.name, url: SITE_URL }, idempotencyKey,
    });

    // Preserve Postgres storage for deployments that run the optional API. Email delivery is
    // authoritative, so an archive outage must not invite the visitor to submit a duplicate.
    if (process.env.API_INTERNAL_URL) {
      try {
        const response = await fetch(`${process.env.API_INTERNAL_URL}/leads`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead), signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) console.error(`Lead archive failed (HTTP ${response.status}).`);
      } catch {
        console.error('Lead archive is unavailable; email was accepted.');
      }
    }
    return { status: 'success' };
  } catch (error) {
    console.error('Could not submit lead', error);
    return { status: 'error', message: 'Não foi possível enviar sua mensagem agora.', values: valuesOf(data) };
  }
}
