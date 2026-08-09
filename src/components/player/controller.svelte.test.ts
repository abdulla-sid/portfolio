import { describe, expect, it, vi } from "vitest";
import { createPlayerController } from "./controller.svelte";

class FakeAudio extends EventTarget {
  preload = "";
  src = "";
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
