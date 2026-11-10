import { afterEach, describe, expect, it, vi } from 'vitest';
import { allowLead } from './lead-rate-limit';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('lead spam limit', () => {
  it('fails closed when production Redis is missing', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const name of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) vi.stubEnv(name, '');
    await expect(allowLead('192.0.2.1')).rejects.toThrow('not configured');
  });
  it('allows five attempts, blocks the sixth, and stores a hashed IP', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example.com'); vi.stubEnv('KV_REST_API_TOKEN', 'token');
    const request = vi.fn().mockResolvedValueOnce(Response.json({ result: 5 })).mockResolvedValueOnce(Response.json({ result: 6 }));
    vi.stubGlobal('fetch', request);
    expect(await allowLead('192.0.2.1')).toBe(true);
    expect(await allowLead('192.0.2.1')).toBe(false);
    expect(request.mock.calls[0][1].body).not.toContain('192.0.2.1');
  });
  it('does not bypass a Redis error', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example.com'); vi.stubEnv('KV_REST_API_TOKEN', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'unavailable' })));
    await expect(allowLead('192.0.2.1')).rejects.toThrow('Invalid');
  });
});
