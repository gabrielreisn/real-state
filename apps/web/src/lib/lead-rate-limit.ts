import { createHash } from 'node:crypto';

/** An atomic, shared limit across Vercel instances; raw IP addresses are never stored. */
export async function allowLead(ip: string) {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.VERCEL_ENV === 'production') throw new Error('Lead rate limiter is not configured.');
    return true;
  }
  const hash = createHash('sha256').update(ip).digest('hex');
  const script = "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 600) end; return n";
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', script, 1, `lead-limit:${process.env.SANITY_DATASET ?? 'development'}:${hash}`]),
    signal: AbortSignal.timeout(2000), cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Lead rate limiter failed (HTTP ${response.status}).`);
  const result = await response.json() as { result?: number; error?: string };
  if (result.error || typeof result.result !== 'number') throw new Error('Invalid lead rate limiter response.');
  return result.result <= 5;
}
