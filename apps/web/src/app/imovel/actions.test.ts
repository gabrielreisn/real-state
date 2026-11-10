import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitLead } from './actions';
import { allowLead } from '@/lib/lead-rate-limit';
import { sendLeadEmail } from '@/lib/lead-email';
import { getPropertyDetail } from '@/content';

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-vercel-forwarded-for': '192.0.2.1' }) }));
vi.mock('@/content', () => ({ SITE_URL: 'https://www.alexnolasco.com.br', getPropertyDetail: vi.fn(), getSiteSettings: async () => ({ name: 'Alex Nolasco Imóveis' }) }));
vi.mock('@/lib/lead-rate-limit', () => ({ allowLead: vi.fn() }));
vi.mock('@/lib/lead-email', async (original) => ({ ...await original<typeof import('@/lib/lead-email')>(), sendLeadEmail: vi.fn() }));

const data = () => {
  const result = new FormData();
  for (const [key, value] of Object.entries({ name: 'Gabriel', phone: '(27) 99969-6096', email: '', message: 'Tenho interesse.', propertyCode: '1168' })) result.set(key, value);
  return result;
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('API_INTERNAL_URL', '');
  vi.mocked(allowLead).mockResolvedValue(true);
  vi.mocked(getPropertyDetail).mockResolvedValue({ code: '1168', title: 'Apartamento', href: '/imovel/1168/apartamento', price: 850000 } as Awaited<ReturnType<typeof getPropertyDetail>>);
  vi.mocked(sendLeadEmail).mockResolvedValue('email-id');
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('property contact form', () => {
  it('ignores honeypot submissions without emailing', async () => {
    const form = data(); form.set('website', 'spam');
    expect(await submitLead({ status: 'idle' }, form)).toEqual({ status: 'success' });
    expect(sendLeadEmail).not.toHaveBeenCalled();
  });
  it('blocks unknown properties and excessive submissions', async () => {
    vi.mocked(allowLead).mockResolvedValueOnce(false);
    expect((await submitLead({ status: 'idle' }, data())).status).toBe('error');
    vi.mocked(getPropertyDetail).mockResolvedValueOnce(null);
    expect((await submitLead({ status: 'idle' }, data())).status).toBe('error');
    expect(sendLeadEmail).not.toHaveBeenCalled();
  });
  it('sends verified property details and deduplicates identical immediate retries', async () => {
    await submitLead({ status: 'idle' }, data());
    expect(await submitLead({ status: 'idle' }, data())).toEqual({ status: 'success' });
    const calls = vi.mocked(sendLeadEmail).mock.calls;
    expect(calls[0][0].property.code).toBe('1168');
    expect(calls[0][0].idempotencyKey).toBe(calls[1][0].idempotencyKey);
  });
  it('preserves form values when email is rejected', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(sendLeadEmail).mockRejectedValueOnce(new Error('Provider unavailable'));
    expect(await submitLead({ status: 'idle' }, data())).toMatchObject({ status: 'error', values: { name: 'Gabriel', message: 'Tenho interesse.' } });
  });
});
