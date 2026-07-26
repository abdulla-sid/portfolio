export function cellOrder(
  count: number,
  rng: () => number = Math.random,
): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function coverCounts(total: number, steps: number): number[] {
  return Array.from({ length: steps }, (_, i) =>
    Math.round(((i + 1) / steps) * total),
  );
}
