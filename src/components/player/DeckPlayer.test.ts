import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";

vi.mock("./itunes", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./itunes")>();
  return {
    ...mod,
    PLAYLIST: [
      { query: "song a", trackId: 1 },
      { query: "song b", trackId: 2 },
    ],

    resolveTrack: vi.fn(async (e: { trackId?: number }) => {
      if (e.trackId === 2) throw new Error("no preview");
      await new Promise((r) => setTimeout(r, 10));
      return {
        title: "Song A",
        artist: "Artist A",
        preview: "https://p/a.m4a",
      };
    }),
  };
});

import DeckPlayer from "./DeckPlayer.svelte";
import { createPlayerController } from "./controller.svelte";
import { PLAYLIST, resolveTrack } from "./itunes";
import { PRESET_LIMIT } from "./playlist";

const ttl = (c: ParentNode) => c.querySelector(".ttl")!.textContent ?? "";

function createDeck() {
  const controller = createPlayerController({
    playlist: PLAYLIST,
    resolve: resolveTrack,
  });
  controller.initialize();
  return controller;
}

function renderDeck(controller = createDeck()) {
  return { controller, ...render(DeckPlayer, { controller }) };
}

describe("DeckPlayer", () => {
  it("offers every track as a preset and disables ones without a preview", async () => {
    const { container } = renderDeck();
    await waitFor(() => expect(ttl(container)).toContain("Song A"));

    const presets = container.querySelectorAll<HTMLButtonElement>(".preset");
    expect(presets).toHaveLength(2);
    expect(presets[1].disabled).toBe(true);

    expect(presets[0].getAttribute("aria-current")).toBe("true");
    expect(presets[1].getAttribute("aria-current")).toBeNull();

    // now-playing stays on screen — selecting a track is not a mode switch
    await fireEvent.click(presets[0]);
    expect(container.querySelector(".vu")).not.toBeNull();
    expect(ttl(container)).toContain("Song A");
  });

  it("tracks the playlist length and stops adding presets at the limit", async () => {
    const build = (length: number) =>
      createPlayerController({
        playlist: Array.from({ length }, (_, i) => ({
          query: `song ${i}`,
          trackId: 100 + i,
        })),
        resolve: async (entry) => ({
          title: `Track ${entry.trackId}`,
          artist: "Artist",
          preview: `https://p/${entry.trackId}.m4a`,
        }),
      });

    const shorter = build(3);
    shorter.initialize();
    const short = render(DeckPlayer, { controller: shorter });
    await waitFor(() => expect(ttl(short.container)).toContain("Track 100"));
    expect(short.container.querySelectorAll(".preset")).toHaveLength(3);
    short.unmount();

    const longer = build(PRESET_LIMIT + 4);
    longer.initialize();
    const long = render(DeckPlayer, { controller: longer });
    await waitFor(() => expect(ttl(long.container)).toContain("Track 100"));
    expect(long.container.querySelectorAll(".preset")).toHaveLength(
      PRESET_LIMIT,
    );
    expect(longer.tracks).toHaveLength(PRESET_LIMIT + 4);

    // a track past the preset row is still reachable through the transport
    const beyond = PRESET_LIMIT + 2;
    longer.selectTrack(beyond);
    await waitFor(() =>
      expect(ttl(long.container)).toContain(`Track ${100 + beyond}`),
    );
  });

  it("seeks with the keyboard and ignores keyboard-synthesised clicks", async () => {
    const { container, controller } = renderDeck();
    await waitFor(() => expect(ttl(container)).toContain("Song A"));

    const seek = container.querySelector(".seek") as HTMLElement;
    expect(seek.getAttribute("role")).toBe("slider");

    const seekSpy = vi.spyOn(controller, "seek");

    // a click with no pointer behind it reports clientX 0 and must not seek
    await fireEvent.click(seek, { detail: 0, clientX: 0 });
    expect(seekSpy).not.toHaveBeenCalled();

    await fireEvent.keyDown(seek, { key: "End" });
    expect(seekSpy).toHaveBeenLastCalledWith(1);

    await fireEvent.keyDown(seek, { key: "Home" });
    expect(seekSpy).toHaveBeenLastCalledWith(0);
  });

  it("persists state across remounts and never constructs a second Audio", async () => {
    const createAudio = vi.fn(() => new Audio());
    const controller = createPlayerController({
      playlist: PLAYLIST,
      resolve: resolveTrack,
      createAudio,
    });
    controller.initialize();

    const first = render(DeckPlayer, { controller });
    await waitFor(() => expect(ttl(first.container)).toContain("Song A"));
    expect(first.container.querySelectorAll(".preset")).toHaveLength(2);
    first.unmount();

    const second = render(DeckPlayer, { controller });
    expect(second.container.querySelectorAll(".preset")).toHaveLength(2);
    expect(ttl(second.container)).toContain("Song A");

    expect(createAudio).toHaveBeenCalledTimes(1);
  });
});
