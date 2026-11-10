'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getSiteSettings } from '@/content';
import { validatePropertySubmission } from '@/lib/property-submission';
import { sendPropertySubmissionEmail } from '@/lib/property-submission-email';
import { allowLead } from '@/lib/lead-rate-limit';

// On error the submitted values come back, because React resets the form after an action.
export type SubmissionState =
  | { status: 'idle' | 'success' }
  | { status: 'error'; message: string; values: Record<string, string>; attempt: number };

const submittedValues = (data: FormData) =>
  Object.fromEntries([...data].filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[0] !== 'website'));

const FIELD_LABELS: Record<string, string> = {
  name: 'nome',
  phone: 'telefone com DDD',
  email: 'e-mail',
  residenceCity: 'cidade onde você mora',
  propertyType: 'tipo de imóvel',
  purpose: 'finalidade',
  propertyCity: 'cidade do imóvel',
  description: 'descrição',
};

export async function submitProperty(_previous: SubmissionState, data: FormData): Promise<SubmissionState> {
  // Bots that fill the honeypot see a normal success and have no reason to retry.
  if (data.get('website')) return { status: 'success' };

  const result = validatePropertySubmission(Object.fromEntries(data));
  if (!result.ok) {
    return {
      status: 'error',
      message: `Confira: ${result.fields.map((field) => FIELD_LABELS[field]).join(', ')}.`,
      values: submittedValues(data),
      attempt: Date.now(),
    };
  }

  try {
    const requestHeaders = await headers();
    const ip = requestHeaders.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
      || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!await allowLead(ip)) return { status: 'error', message: 'Você enviou vários formulários. Aguarde alguns minutos antes de tentar novamente.', values: submittedValues(data), attempt: Date.now() };
    const site = await getSiteSettings();
    const bucket = Math.floor(Date.now() / 600_000);
    const idempotencyKey = createHash('sha256').update(JSON.stringify({ form: 'property-submission', submission: result.value, bucket })).digest('hex');
    await sendPropertySubmissionEmail(result.value, site.name, idempotencyKey);
    return { status: 'success' };
  } catch (error) {
    console.error('Could not email property submission', error);
    return { status: 'error', message: 'Não foi possível enviar o cadastro agora.', values: submittedValues(data), attempt: Date.now() };
  }
}
