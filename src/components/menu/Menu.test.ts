import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import Menu from "./Menu.svelte";

describe("Menu commit semantics", () => {
  afterEach(() => vi.useRealTimers());

  it("requires a second click after highlighting before it commits", async () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { getByRole } = render(Menu, { onCommit });
    const button = getByRole("button", { name: "ABOUT ME" });
    await fireEvent.click(button);
    await vi.advanceTimersByTimeAsync(120);
    expect(onCommit).not.toHaveBeenCalled();
    await fireEvent.click(button);
    expect(onCommit).toHaveBeenCalledWith("about");
  });

  it("commits the selected item on Enter", async () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { getByRole } = render(Menu, { onCommit });
    await fireEvent.click(getByRole("button", { name: "EXPERIENCE" }));
    await vi.advanceTimersByTimeAsync(120);
    await fireEvent.keyDown(document, { key: "Enter" });
    expect(onCommit).toHaveBeenCalledWith("experience");
  });

  it("does not reverse the highlight on Escape while a window is open", async () => {
    vi.useFakeTimers();
    const { getByRole, container } = render(Menu, {
      onCommit: () => {},
      windowOpen: true,
    });
    await fireEvent.click(getByRole("button", { name: "ABOUT ME" }));
    await vi.advanceTimersByTimeAsync(120);
    await fireEvent.keyDown(document, { key: "Escape" });
    expect(container.querySelector(".menu-item.is-selected")).not.toBeNull();
  });

  it("leaves keyboard events from external controls alone", async () => {
    vi.useFakeTimers();
    for (const tag of ["input", "textarea", "select", "button", "a", "div"]) {
      const { container, unmount } = render(Menu);
      const control = document.createElement(tag);
      if (control instanceof HTMLAnchorElement) control.href = "#target";
      if (tag === "div") control.setAttribute("contenteditable", "true");
      document.body.appendChild(control);
      (control as HTMLElement).tabIndex = 0;
      (control as HTMLElement).focus();

      await fireEvent.keyDown(control, {
        key: tag === "button" || tag === "a" ? "Enter" : "a",
      });
      await vi.advanceTimersByTimeAsync(120);

      expect(document.activeElement).toBe(control);
      expect(container.querySelector(".menu-item.is-selected")).toBeNull();
      control.remove();
      unmount();
    }
  });

  it("cancels a pending mobile commit when unmounted", async () => {
    vi.useFakeTimers();
    vi.mocked(globalThis.matchMedia).mockReturnValue({
      ...globalThis.matchMedia(""),
      matches: true,
    });
    const onCommit = vi.fn();
    const { getByRole, unmount } = render(Menu, { onCommit });
    await fireEvent.click(getByRole("button", { name: "ABOUT ME" }));
    unmount();
    await vi.advanceTimersByTimeAsync(120);
    expect(onCommit).not.toHaveBeenCalled();
  });
});
