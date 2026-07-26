import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import DaveWidget from "./DaveWidget.svelte";

const touch = (type: "pointerdown" | "pointerup", x = 20, y = 20) => {
  const event = new PointerEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  return event;
};

describe("DaveWidget", () => {
  it("toggles for taps without treating touch drags as taps", async () => {
    const { container } = render(DaveWidget);
    const dave = container.querySelector<HTMLElement>(".dave-widget");

    expect(dave).not.toBeNull();
    dave?.dispatchEvent(touch("pointerdown"));
    dave?.dispatchEvent(touch("pointerup"));
    await tick();
    expect(dave).toHaveClass("tapped");
    expect(dave).toHaveClass("touched");

    dave?.dispatchEvent(touch("pointerdown"));
    dave?.dispatchEvent(touch("pointerup"));
    await tick();
    expect(dave).not.toHaveClass("tapped");

    dave?.dispatchEvent(touch("pointerdown", 10, 10));
    dave?.dispatchEvent(touch("pointerup", 40, 40));
    await tick();
    expect(dave).not.toHaveClass("tapped");
  });
});
