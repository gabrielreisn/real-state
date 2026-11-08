'use server';

import { randomUUID } from 'node:crypto';
import { validatePropertySubmission } from '@/lib/property-submission';
import { sanityWriteClient } from '@/lib/sanity/write-client';

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
    await sanityWriteClient().create({
      // A dot in the ID keeps the document private: never readable through the public API.
      _id: `submission.${randomUUID()}`,
      _type: 'propertySubmission',
      status: 'new',
      submittedAt: new Date().toISOString(),
      ...result.value,
    });
    return { status: 'success' };
  } catch (error) {
    console.error('Could not save property submission', error);
    return { status: 'error', message: 'Não foi possível enviar o cadastro agora.', values: submittedValues(data), attempt: Date.now() };
  }
}
