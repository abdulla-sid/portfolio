import { describe, expect, it, vi } from "vitest";
import { createPlayerController } from "./controller.svelte";

class FakeAudio extends EventTarget {
  preload = "";
  srcWrites = 0;
  #src = "";
  get src() {
    return this.#src;
  }
  set src(value: string) {
    this.#src = value;
    this.srcWrites++;
  }
  paused = true;
  currentTime = 0;
  duration = 30;
  play = vi.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  });
  removeAttribute = vi.fn((name: string) => {
    if (name === "src") this.src = "";
  });
}

const playlist = [
  { query: "first", trackId: 1 },
  { query: "second", trackId: 2 },
];

describe("player controller", () => {
  it("constructs Audio only during explicit initialization", () => {
    const createAudio = vi.fn(
      () => new FakeAudio() as unknown as HTMLAudioElement,
    );
    const player = createPlayerController({
      playlist,
      resolve: vi.fn(() => new Promise<never>(() => {})),
      createAudio,
    });
    expect(createAudio).not.toHaveBeenCalled();
    player.initialize();
    player.initialize();
    expect(createAudio).toHaveBeenCalledTimes(1);
  });

  it("chooses the lowest-index resolved preview regardless of resolution order", async () => {
    const resolvers: ((value: {
      title: string;
      artist: string;
      preview: string;
    }) => void)[] = [];
    const player = createPlayerController({
      playlist,
      resolve: () => new Promise((resolve) => resolvers.push(resolve)),
      createAudio: () => new FakeAudio() as unknown as HTMLAudioElement,
    });
    player.initialize();
    resolvers[1]({ title: "Second", artist: "B", preview: "second.m4a" });
    await Promise.resolve();
    expect(player.current).toBe(1);
    resolvers[0]({ title: "First", artist: "A", preview: "first.m4a" });
    await Promise.resolve();
    expect(player.current).toBe(0);
  });

  it("supports play, selection, seek, wrap, and ended behavior", async () => {
    const audio = new FakeAudio();
    const player = createPlayerController({
      playlist,
      resolve: async (entry) => ({
        title: entry.query,
        artist: "artist",
        preview: `${entry.query}.m4a`,
      }),
      createAudio: () => audio as unknown as HTMLAudioElement,
    });
    player.initialize();
    await Promise.resolve();
    player.togglePlay();
    expect(audio.src).toContain("first.m4a");
    expect(player.playing).toBe(true);
    player.pause();
    expect(audio.pause).toHaveBeenCalled();
    expect(player.current).toBe(0);
    expect(audio.src).toContain("first.m4a");
    player.step(-1);
    expect(player.current).toBe(1);
    player.seek(0.5);
    expect(audio.currentTime).toBe(15);
    audio.dispatchEvent(new Event("ended"));
    expect(player.current).toBe(0);
  });

  it("warms the resolved track and keeps that buffer on the first press", async () => {
    const audio = new FakeAudio();
    const player = createPlayerController({
      playlist,
      resolve: async (entry) => ({
        title: entry.query,
        artist: "artist",
        preview: `${entry.query}.m4a`,
      }),
      createAudio: () => audio as unknown as HTMLAudioElement,
    });
    player.initialize();
    await Promise.resolve();

    expect(audio.preload).toBe("metadata");
    expect(audio.src).toContain("first.m4a");
    expect(audio.play).not.toHaveBeenCalled();

    const writesWhileWarm = audio.srcWrites;
    player.togglePlay();
    expect(audio.play).toHaveBeenCalled();
    expect(audio.srcWrites).toBe(writesWhileWarm);
  });

  it("warms only the track that will actually play when previews resolve out of order", async () => {
    const resolvers: {
      resolve: (value: {
        title: string;
        artist: string;
        preview: string;
      }) => void;
      reject: () => void;
    }[] = [];
    const audio = new FakeAudio();
    const player = createPlayerController({
      playlist,
      resolve: () =>
        new Promise((resolve, reject) => resolvers.push({ resolve, reject })),
      createAudio: () => audio as unknown as HTMLAudioElement,
    });
    player.initialize();

    resolvers[1].resolve({
      title: "Second",
      artist: "B",
      preview: "second.m4a",
    });
    await Promise.resolve();
    expect(player.current).toBe(1);
    expect(audio.srcWrites).toBe(0);

    resolvers[0].resolve({ title: "First", artist: "A", preview: "first.m4a" });
    await Promise.resolve();
    expect(player.current).toBe(0);
    expect(audio.src).toContain("first.m4a");
    expect(audio.srcWrites).toBe(1);
  });

  it("stays unheard while the browser buffers so the meter cannot lead the audio", async () => {
    const audio = new FakeAudio();
    const player = createPlayerController({
      playlist,
      resolve: async (entry) => ({
        title: entry.query,
        artist: "artist",
        preview: `${entry.query}.m4a`,
      }),
      createAudio: () => audio as unknown as HTMLAudioElement,
    });
    player.initialize();
    await Promise.resolve();

    player.togglePlay();
    expect(player.playing).toBe(true);
    expect(player.buffering).toBe(true);

    audio.dispatchEvent(new Event("playing"));
    expect(player.buffering).toBe(false);

    audio.dispatchEvent(new Event("waiting"));
    expect(player.buffering).toBe(true);

    audio.dispatchEvent(new Event("playing"));
    player.pause();
    expect(player.buffering).toBe(false);
  });

  it("disposes listeners and ignores late metadata settlement", async () => {
    let settle!: (value: {
      title: string;
      artist: string;
      preview: string;
    }) => void;
    const audio = new FakeAudio();
    const player = createPlayerController({
      playlist: [playlist[0]],
      resolve: () => new Promise((resolve) => (settle = resolve)),
      createAudio: () => audio as unknown as HTMLAudioElement,
    });
    player.initialize();
    player.dispose();
    player.dispose();
    settle({ title: "Late", artist: "Late", preview: "late.m4a" });
    await Promise.resolve();
    audio.dispatchEvent(new Event("play"));
    expect(player.title).toBe("loading…");
    expect(player.playing).toBe(false);
    expect(audio.removeAttribute).toHaveBeenCalledWith("src");
  });
});
