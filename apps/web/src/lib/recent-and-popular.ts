/**
 * Alternates the newest listings with the most visited ones, skipping repeats. A new listing leads
 * because it has had no time to gather visits. Without visit data this is simply the newest listings.
 */
export function recentAndPopular<T extends { id: string; code: string }>(properties: T[], views: Map<string, number>, count: number) {
  const byNewest = (a: T, b: T) => Number(b.code) - Number(a.code);
  const recent = properties.toSorted(byNewest);
  const popular = properties
    .filter((property) => (views.get(property.id) ?? 0) > 0)
    .toSorted((a, b) => views.get(b.id)! - views.get(a.id)! || byNewest(a, b));

  const picked = new Set<T>();
  const next = (queue: T[]) => queue.find((property) => !picked.has(property));
  while (picked.size < Math.min(count, properties.length)) {
    const fromQueue = next(picked.size % 2 === 0 ? recent : popular) ?? next(recent);
    picked.add(fromQueue!);
  }
  return [...picked];
}
