import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";

vi.mock("./components/player/itunes", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("./components/player/itunes")>();
  return { ...mod, resolveTrack: vi.fn(() => new Promise(() => {})) };
});

import App from "./App.svelte";
import { resolveTrack } from "./components/player/itunes";
import { mediaPause } from "./test/mocks/browser";

describe("App", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(resolveTrack).mockClear();
  });

  it("closes the current section before reopening the selected section", async () => {
    vi.useFakeTimers();
    const { getByRole, queryByRole, container } = render(App);
    const about = getByRole("button", { name: "ABOUT ME" });
    await fireEvent.click(about);
    await vi.advanceTimersByTimeAsync(330);

    const projects = getByRole("button", { name: "PROJECTS" });
    await fireEvent.click(projects);
    await vi.advanceTimersByTimeAsync(120);

    expect(
      getByRole("dialog", { name: "ABOUT ME window" }),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-widget-id="player"]')).toHaveClass(
      "mobile-hidden",
    );

    await vi.advanceTimersByTimeAsync(108);
    expect(queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".widget")).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(216);
    expect(
      getByRole("dialog", { name: "PROJECTS window" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".widget")).toHaveLength(2);
  });

  it("closes with animation, then reopens", async () => {
    vi.useFakeTimers();
    const { container, getByRole, queryByRole } = render(App);
    const about = getByRole("button", { name: "ABOUT ME" });
    await fireEvent.click(about);
    await vi.advanceTimersByTimeAsync(330);

    expect(
      container.querySelector('[data-widget-id="player"]'),
    ).not.toHaveClass("mobile-hidden");
    const pauseCallsBeforeClose = mediaPause.mock.calls.length;
    await fireEvent.click(getByRole("button", { name: "Close" }));
    expect(mediaPause).toHaveBeenCalledTimes(pauseCallsBeforeClose);
    expect(container.querySelector('[data-widget-id="player"]')).toHaveClass(
      "mobile-hidden",
    );
    expect(queryByRole("dialog")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(210);
    expect(queryByRole("dialog")).not.toBeInTheDocument();

    await fireEvent.click(about);
    await vi.advanceTimersByTimeAsync(330);
    expect(
      getByRole("dialog", { name: "ABOUT ME window" }),
    ).toBeInTheDocument();
  });
});
