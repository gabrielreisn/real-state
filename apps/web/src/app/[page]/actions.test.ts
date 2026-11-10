import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitProperty } from './actions';
import { allowLead } from '@/lib/lead-rate-limit';
import { sendPropertySubmissionEmail } from '@/lib/property-submission-email';
import { sanityWriteClient } from '@/lib/sanity/write-client';

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-vercel-forwarded-for': '192.0.2.2' }) }));
vi.mock('@/content', () => ({ getSiteSettings: async () => ({ name: 'Alex Nolasco Imóveis' }) }));
vi.mock('@/lib/lead-rate-limit', () => ({ allowLead: vi.fn() }));
vi.mock('@/lib/property-submission-email', () => ({ sendPropertySubmissionEmail: vi.fn() }));
vi.mock('@/lib/sanity/write-client', () => ({ sanityWriteClient: vi.fn() }));

const data = () => {
  const result = new FormData();
  for (const [key, value] of Object.entries({ name: 'Gabriel', phone: '(27) 99969-6096', email: '', propertyType: 'Apartamento', purpose: 'Venda', propertyCity: 'Vila Velha / ES', description: 'Apartamento de 3 quartos.' })) result.set(key, value);
  return result;
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(1794272000000);
  vi.mocked(allowLead).mockResolvedValue(true);
  vi.mocked(sendPropertySubmissionEmail).mockResolvedValue('email-id');
});
afterEach(() => vi.restoreAllMocks());

describe('owner submission form', () => {
  it('sends all owner details by email and never creates a Sanity document', async () => {
    expect(await submitProperty({ status: 'idle' }, data())).toEqual({ status: 'success' });
    expect(sendPropertySubmissionEmail).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gabriel', propertyType: 'Apartamento', propertyCity: 'Vila Velha / ES' }), 'Alex Nolasco Imóveis', expect.any(String));
    expect(sanityWriteClient).not.toHaveBeenCalled();
  });
  it('blocks honeypot, invalid fields, and excessive submissions before sending', async () => {
    const bot = data(); bot.set('website', 'spam');
    await submitProperty({ status: 'idle' }, bot);
    const invalid = data(); invalid.delete('name');
    expect((await submitProperty({ status: 'idle' }, invalid)).status).toBe('error');
    vi.mocked(allowLead).mockResolvedValue(false);
    expect((await submitProperty({ status: 'idle' }, data())).status).toBe('error');
    expect(sendPropertySubmissionEmail).not.toHaveBeenCalled();
  });
  it('preserves data on failure and reuses the retry key', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(sendPropertySubmissionEmail).mockRejectedValueOnce(new Error('Not sent'));
    expect(await submitProperty({ status: 'idle' }, data())).toMatchObject({ status: 'error', values: { name: 'Gabriel', propertyType: 'Apartamento' } });
    expect((await submitProperty({ status: 'idle' }, data())).status).toBe('success');
    const calls = vi.mocked(sendPropertySubmissionEmail).mock.calls;
    expect(calls[0][2]).toBe(calls[1][2]);
  });
});
