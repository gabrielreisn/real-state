// Visits per listing, kept in Redis over its REST API as one sorted set per day. Without the
// environment variables nothing is recorded and the home page orders listings by date alone.

const WINDOW_DAYS = 30;
const KEEP_SECONDS = (WINDOW_DAYS + 5) * 86_400;
const REFRESH_SECONDS = 900;
const TIMEOUT_MS = 1500;

function connection() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// One key space per dataset, so local and preview visits never count toward production.
const dayKey = (date: Date) => `views:${process.env.SANITY_DATASET ?? 'development'}:${date.toISOString().slice(0, 10)}`;

export const windowKeys = (now: Date) => Array.from({ length: WINDOW_DAYS }, (_, days) => dayKey(new Date(now.getTime() - days * 86_400_000)));

/** Redis answers ZUNION WITHSCORES with a flat list: member, score, member, score. */
export function parseScores(flat: unknown) {
  const scores = new Map<string, number>();
  if (!Array.isArray(flat)) return scores;
  for (let index = 0; index + 1 < flat.length; index += 2) {
    const score = Number(flat[index + 1]);
    if (Number.isFinite(score)) scores.set(String(flat[index]), score);
  }
  return scores;
}

export async function recordPropertyView(id: string) {
  const redis = connection();
  if (!redis) return;
  const key = dayKey(new Date());
  try {
    const response = await fetch(`${redis.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redis.token}` },
      body: JSON.stringify([
        ['ZINCRBY', key, 1, id],
        ['EXPIRE', key, KEEP_SECONDS],
      ]),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) console.error(`Recording a property view failed: HTTP ${response.status}`);
  } catch (error) {
    console.error('Recording a property view failed:', error);
  }
}

/** Visits per listing id over the last 30 days. Empty when the store is missing or unreachable. */
export async function getPropertyViews() {
  const redis = connection();
  if (!redis) return new Map<string, number>();
  const keys = windowKeys(new Date());
  try {
    const response = await fetch(redis.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redis.token}` },
      body: JSON.stringify(['ZUNION', keys.length, ...keys, 'WITHSCORES']),
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { result } = (await response.json()) as { result?: unknown };
    return parseScores(result);
  } catch (error) {
    console.error('Reading property views failed:', error);
    return new Map<string, number>();
  }
}
