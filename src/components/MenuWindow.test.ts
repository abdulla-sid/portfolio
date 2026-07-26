import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import MenuWindow from "./MenuWindow.svelte";
import type { MenuId } from "../app/menu";
import { createPlayerController } from "./player/controller.svelte";
import { playerContext } from "./player/context.svelte";

function renderWindow(props: { id: MenuId; onClosed: () => void }) {
  const player = createPlayerController({
    playlist: [],
    resolve: () => Promise.reject(new Error("unexpected track resolution")),
  });
  return render(MenuWindow, {
    props,
    context: playerContext(player),
  });
}

describe("MenuWindow", () => {
  afterEach(() => vi.useRealTimers());

  it("closes via the X button after its animation, then fires onClosed once", async () => {
    vi.useFakeTimers();
    const onClosed = vi.fn();
    const { getByRole } = renderWindow({ id: "projects", onClosed });
    await vi.advanceTimersByTimeAsync(210);

    await fireEvent.click(getByRole("button", { name: "Close" }));
    expect(onClosed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(210);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it("closes via Escape", async () => {
    vi.useFakeTimers();
    const onClosed = vi.fn();
    renderWindow({ id: "experience", onClosed });
    await vi.advanceTimersByTimeAsync(210);

    await fireEvent.keyDown(window, { key: "Escape" });
    await vi.advanceTimersByTimeAsync(210);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the dialog and restores it after close", async () => {
    vi.useFakeTimers();
    const menuButton = document.createElement("button");
    menuButton.className = "menu-item";
    menuButton.setAttribute("aria-pressed", "true");
    document.body.appendChild(menuButton);
    menuButton.focus();

    const { getByRole } = renderWindow({
      id: "about",
      onClosed: () => {},
    });
    await vi.advanceTimersByTimeAsync(210);

    expect(document.activeElement).toBe(getByRole("dialog"));
    const closeButton = getByRole("button", { name: "Close" });
    closeButton.focus();
    await fireEvent.click(closeButton);
    await vi.advanceTimersByTimeAsync(210);

    expect(document.activeElement).toBe(menuButton);
    menuButton.remove();
  });
});
