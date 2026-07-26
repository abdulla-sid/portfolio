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
  it("opens a safe track list and returns to now-playing after selection", async () => {
    const { container, getByText } = renderDeck();
    await waitFor(() => expect(ttl(container)).toContain("Song A"));

    await fireEvent.click(getByText("MENU"));

    const rows = container.querySelectorAll(".row");
    expect(rows).toHaveLength(2);
    expect((rows[1] as HTMLButtonElement).disabled).toBe(true);

    expect(container.querySelector(".vu")).toBeNull();
    await fireEvent.click(container.querySelector(".row") as HTMLButtonElement);

    expect(container.querySelector(".row")).toBeNull();
    expect(container.querySelector(".vu")).not.toBeNull();
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

    await fireEvent.click(
      first.container.querySelector(".menu") as HTMLElement,
    );
    expect(first.container.querySelectorAll(".row")).toHaveLength(2);
    first.unmount();

    const second = render(DeckPlayer, { controller });
    expect(second.container.querySelectorAll(".row")).toHaveLength(2);

    expect(createAudio).toHaveBeenCalledTimes(1);
  });
});
