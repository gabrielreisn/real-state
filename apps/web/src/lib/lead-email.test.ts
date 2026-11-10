import { afterEach, describe, expect, it, vi } from 'vitest';
import { leadEmail, sendLeadEmail, validateLead, type Lead } from './lead-email';

const lead: Lead = { name: 'Gabriel', email: 'gabriel@example.com', phone: '(27) 99969-6096', message: 'Quero conhecer este imóvel.', propertyCode: '1168' };
const property = { code: '1168', title: 'Apartamento em Vila Velha', href: '/imovel/1168/apartamento', price: 850000 };
const site = { name: 'Alex Nolasco Imóveis', url: 'https://www.alexnolasco.com.br' };
const form = (values: Record<string, unknown>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) if (typeof value === 'string') data.set(key, value);
  return data;
};

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('lead validation', () => {
  it('accepts a Brazilian phone with country code and optional blank email', () => {
    expect(validateLead(form({ ...lead, phone: '+55 (27) 99969-6096', email: '  ' }))).toMatchObject({ email: undefined });
  });
  it.each([
    { name: '' }, { phone: '..........' }, { phone: '1234' }, { email: 'bad@example.com\r\nBcc: attacker@example.com' },
    { propertyCode: '../../something' }, { message: 'a'.repeat(2001) },
  ])('rejects invalid or oversized input: %j', (invalid) => {
    expect(validateLead(form({ ...lead, ...invalid }))).toBeNull();
  });
});

describe('lead notification', () => {
  it('escapes visitor content, preserves line breaks and links the property', () => {
    const email = leadEmail({ ...lead, name: '<script>bad</script>', message: 'Primeira linha\n<img src=x onerror=alert(1)>' }, property, site);
    expect(email.subject).toBe('Mais informações do Imóvel #1168');
    expect(email.html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(email.html).toContain('Primeira linha<br>&lt;img');
    expect(email.html).not.toContain('<script>');
    expect(email.text).toContain('https://www.alexnolasco.com.br/imovel/1168/apartamento');
    expect(email.text).toContain('850.000');
  });
  it('uses the configured recipient and sender, visitor Reply-To, and retry key', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key'); vi.stubEnv('LEAD_EMAIL_FROM', 'Site <site@example.com>'); vi.stubEnv('LEAD_EMAIL_TO', 'owner@example.com');
    const request = vi.fn().mockResolvedValue(Response.json({ id: 'email-id' }));
    vi.stubGlobal('fetch', request);
    expect(await sendLeadEmail({ lead, property, site, idempotencyKey: 'retry-key' })).toBe('email-id');
    const [, options] = request.mock.calls[0];
    expect(options.headers['Idempotency-Key']).toBe('retry-key');
    expect(JSON.parse(options.body)).toMatchObject({ from: 'Site <site@example.com>', to: ['owner@example.com'], reply_to: lead.email });
  });
  it('does not pretend to send without configuration', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    await expect(sendLeadEmail({ lead, property, site, idempotencyKey: 'test' })).rejects.toThrow('requires');
    expect(request).not.toHaveBeenCalled();
  });
  it('uses the sending domain provisioned by the Vercel integration', async () => {
    vi.stubEnv('RESEND_API_KEY', 'key'); vi.stubEnv('RESEND_EMAIL_DOMAIN', 'mail.example.com');
    vi.stubEnv('LEAD_EMAIL_FROM', ''); vi.stubEnv('LEAD_EMAIL_TO', 'owner@example.com');
    const request = vi.fn().mockResolvedValue(Response.json({ id: 'email-id' })); vi.stubGlobal('fetch', request);
    await sendLeadEmail({ lead, property, site, idempotencyKey: 'test' });
    expect(JSON.parse(request.mock.calls[0][1].body).from).toBe('Alex Nolasco Imóveis <contato@mail.example.com>');
  });
  it('surfaces provider rejection rather than reporting success', async () => {
    vi.stubEnv('RESEND_API_KEY', 'key'); vi.stubEnv('LEAD_EMAIL_FROM', 'from@example.com'); vi.stubEnv('LEAD_EMAIL_TO', 'to@example.com');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
    await expect(sendLeadEmail({ lead, property, site, idempotencyKey: 'test' })).rejects.toThrow('HTTP 429');
  });
});
