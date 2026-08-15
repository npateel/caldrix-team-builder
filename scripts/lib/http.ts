export async function fetchJson<T>(url: string, retries = 5): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json() as Promise<T>;

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(2 ** attempt * 500, 10_000)));
      continue;
    }
    throw new Error(`GET ${url} failed with ${res.status}`);
  }
  throw new Error(`Exhausted retries for ${url}`);
}

export function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match) throw new Error(`Could not parse id from url: ${url}`);
  return Number(match[1]);
}

// Runs `mapper` over `items` with at most `concurrency` in flight at once --
// PokéAPI has no documented rate limit, but this keeps us a well-behaved
// client instead of firing ~2000 requests at once.
export async function pMap<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
