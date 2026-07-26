import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonp, resetTrackCache, resolveTrack } from "./itunes";

function interceptJsonp(respond: (url: string) => unknown) {
  const original = document.head.appendChild.bind(document.head);
  return vi
    .spyOn(document.head, "appendChild")
    .mockImplementation((node: Node) => {
      const script = node as HTMLScriptElement;
      const cb = new URL(script.src).searchParams.get("callback")!;
      const callbacks = window as unknown as Record<
        string,
        ((value: unknown) => void) | undefined
      >;
      queueMicrotask(() => callbacks[cb]?.(respond(script.src)));
      return original(node);
    });
}

afterEach(() => {
  resetTrackCache();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("resolveTrack", () => {
  it("chooses lookup for pinned tracks and search otherwise", async () => {
    const spy = interceptJsonp(() => ({
      results: [
        { trackName: "T", artistName: "A", previewUrl: "https://p/x.m4a" },
      ],
    }));
    const track = await resolveTrack({ query: "ignored", trackId: 42 });
    expect(spy.mock.calls[0][0]).toHaveProperty(
      "src",
      expect.stringContaining("itunes.apple.com/lookup?id=42"),
    );
    expect(track).toEqual({
      title: "T",
      artist: "A",
      preview: "https://p/x.m4a",
    });
    await resolveTrack({ query: "some song" });
    expect((spy.mock.calls[1][0] as HTMLScriptElement).src).toContain(
      "search?media=music&limit=1&term=some%20song",
    );
  });

  it("rejects when the result has no preview", async () => {
    interceptJsonp(() => ({ results: [{ trackName: "T", artistName: "A" }] }));
    await expect(resolveTrack({ query: "x", trackId: 7 })).rejects.toThrow(
      /no preview/,
    );
  });

  it("shares concurrent identical track requests", async () => {
    const spy = interceptJsonp(() => ({
      results: [
        { trackName: "T", artistName: "A", previewUrl: "https://p/z.m4a" },
      ],
    }));
    const entry = { query: "same", trackId: 99 };
    const [first, second] = await Promise.all([
      resolveTrack(entry),
      resolveTrack(entry),
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("removes failed requests from the cache so an explicit retry can run", async () => {
    let attempt = 0;
    const spy = interceptJsonp(() => {
      attempt += 1;
      return attempt === 1
        ? { results: [] }
        : {
            results: [
              {
                trackName: "Retry",
                artistName: "A",
                previewUrl: "https://p/retry.m4a",
              },
            ],
          };
    });
    const entry = { query: "retry", trackId: 100 };
    await expect(resolveTrack(entry)).rejects.toThrow(/no preview/);
    await expect(resolveTrack(entry)).resolves.toHaveProperty(
      "preview",
      "https://p/retry.m4a",
    );
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("cleans the callback and script when aborted", async () => {
    const append = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node) => node);
    const controller = new AbortController();
    const request = jsonp("https://example.test/data", 8000, controller.signal);
    const script = append.mock.calls[0][0] as HTMLScriptElement;
    const callback = new URL(script.src).searchParams.get("callback")!;
    expect(callback in window).toBe(true);
    controller.abort();
    await expect(request).rejects.toHaveProperty("name", "AbortError");
    expect(callback in window).toBe(false);
    expect(script.isConnected).toBe(false);
    expect(script.onerror).toBeNull();
  });
});
