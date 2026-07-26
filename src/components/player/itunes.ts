export interface PlaylistEntry {
  query: string;

  trackId?: number;
}

export interface ResolvedTrack {
  title: string;
  artist: string;
  preview: string;
}

export const PLAYLIST: PlaylistEntry[] = [
  { query: "detonate charli xcx", trackId: 1513162584 },
  { query: "you lose 8-bit magdalena bay", trackId: 1636364834 },
  { query: "ipod touch ninajirachi", trackId: 1817553617 },
  { query: "hayloft 2 mother mother", trackId: 1594441149 },
  { query: "all the time the strokes" },
  { query: "under pressure queen" },
];

const LOOKUP = "https://itunes.apple.com/lookup?id=";
const SEARCH = "https://itunes.apple.com/search?media=music&limit=1&term=";

let jsonpSequence = 0;
export function jsonp(
  url: string,
  timeoutMs = 8000,
  signal?: AbortSignal,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const nonce =
      globalThis.crypto?.randomUUID?.().replaceAll("-", "_") ??
      `${Date.now()}_${++jsonpSequence}`;
    const cb = `__itunes_cb_${nonce}_${++jsonpSequence}`;
    const script = document.createElement("script");
    let settled = false;
    const cleanup = () => {
      Reflect.deleteProperty(window, cb);
      script.onerror = null;
      script.remove();
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };
    const fail = (error: Error | DOMException) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () => fail(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(() => fail(new Error("jsonp timeout")), timeoutMs);
    Reflect.set(window, cb, (data: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    });
    script.onerror = () => fail(new Error("jsonp load error"));
    signal?.addEventListener("abort", abort, { once: true });
    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${cb}`;
    document.head.appendChild(script);
  });
}

interface ITunesResult {
  results?: { trackName?: string; artistName?: string; previewUrl?: string }[];
}

const trackCache = new Map<string, Promise<ResolvedTrack>>();

function cacheKey(entry: PlaylistEntry): string {
  return entry.trackId ? `id:${entry.trackId}` : `query:${entry.query}`;
}

async function requestTrack(entry: PlaylistEntry): Promise<ResolvedTrack> {
  const url = entry.trackId
    ? `${LOOKUP}${entry.trackId}`
    : `${SEARCH}${encodeURIComponent(entry.query)}`;
  const data = (await jsonp(url)) as ITunesResult;
  const r = data?.results?.[0];
  if (!r?.previewUrl)
    throw new Error(`no preview for ${entry.trackId ?? entry.query}`);
  return {
    title: r.trackName ?? "",
    artist: r.artistName ?? "",
    preview: r.previewUrl,
  };
}

export function resolveTrack(entry: PlaylistEntry): Promise<ResolvedTrack> {
  const key = cacheKey(entry);
  const cached = trackCache.get(key);
  if (cached) return cached;

  const request = requestTrack(entry).catch((error) => {
    if (trackCache.get(key) === request) trackCache.delete(key);
    throw error;
  });
  trackCache.set(key, request);
  return request;
}

export function resetTrackCache() {
  trackCache.clear();
}
