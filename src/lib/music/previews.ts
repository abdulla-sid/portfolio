import { playlist, type Track } from '../../content/music';

/** Build time only: one 30-second iTunes preview URL per track, or null where none could be found. */
export async function resolvePreviews(
  tracks: readonly Omit<Track, 'id'>[],
  get = fetchJson,
): Promise<(string | null)[]> {
  const ids = tracks.flatMap((t) => (t.itunesId ? [t.itunesId] : []));
  const byId = new Map<number, string>();
  if (ids.length) {
    for (const r of await results(get, `lookup?id=${ids.join(',')}`)) {
      const url = previewOf(r);
      if (url && typeof r.trackId === 'number') byId.set(r.trackId, url);
    }
  }
  return Promise.all(
    tracks.map(async (t) => {
      if (t.itunesId) return byId.get(t.itunesId) ?? null;
      const [hit] = await results(
        get,
        `search?media=music&entity=song&limit=1&term=${encodeURIComponent(`${t.title} ${t.artist}`)}`,
      );
      return hit ? previewOf(hit) : null;
    }),
  );
}

interface Result {
  trackId?: unknown;
  previewUrl?: unknown;
}

// Only https audio from Apple's CDN goes into the page.
const previewOf = (r: Result): string | null =>
  typeof r.previewUrl === 'string' && /^https:\/\/[\w.-]+\.apple\.com\//.test(r.previewUrl)
    ? r.previewUrl
    : null;

// A failed or odd response means no previews, never a failed build.
async function results(get: (url: string) => Promise<unknown>, path: string): Promise<Result[]> {
  try {
    const body = await get(`https://itunes.apple.com/${path}`);
    const list = (body as { results?: unknown })?.results;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}

/** The playlist's previews as JSON that is safe inside a <script> element ('<' escaped, so no '</script>'). */
export const playlistPreviews = async (): Promise<string> =>
  JSON.stringify(await resolvePreviews(playlist)).replaceAll('<', '\\u003c');
