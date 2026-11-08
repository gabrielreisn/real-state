'use server';

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

  try {
    const response = await fetch(`${process.env.API_INTERNAL_URL ?? 'http://localhost:4000'}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: field(data, 'name'),
        email: field(data, 'email'),
        phone: field(data, 'phone'),
        message: field(data, 'message'),
        propertyCode: field(data, 'propertyCode'),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 400) {
      return { status: 'error', message: 'Confira os dados informados, principalmente o telefone com DDD.', values: valuesOf(data) };
    }
    if (!response.ok) throw new Error(`Lead API responded ${response.status}`);
    return { status: 'success' };
  } catch (error) {
    console.error('Could not submit lead', error);
    return { status: 'error', message: 'Não foi possível enviar sua mensagem agora.', values: valuesOf(data) };
  }
}
