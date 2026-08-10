import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Pager from "./Pager.svelte";

const COUNT = 3;

function mount() {
  const children = createRawSnippet(() => ({
    render: () => `<section>page</section>`,
  }));
  const view = render(Pager, {
    props: {
      count: COUNT,
      index: 0,
      itemLabel: "item",
      announcement: "first",
      children,
    },
  });
  return {
    ...view,
    prev: view.getByRole("button", { name: "Previous item" }),
    next: view.getByRole("button", { name: "Next item" }),
    activeIndex: () =>
      [...view.container.querySelectorAll(".node")].findIndex((node) =>
        node.classList.contains("active"),
      ),
  };
}

describe("Pager", () => {
  it("steps with the arrow keys and stops at both ends", async () => {
    const { prev, next, activeIndex } = mount();
    expect(activeIndex()).toBe(0);
    expect(prev).toBeDisabled();

    await fireEvent.keyDown(next, { key: "ArrowRight" });
    expect(activeIndex()).toBe(1);
    expect(prev).toBeEnabled();

    await fireEvent.keyDown(next, { key: "ArrowRight" });
    expect(activeIndex()).toBe(COUNT - 1);
    expect(next).toBeDisabled();

    await fireEvent.keyDown(prev, { key: "ArrowRight" });
    expect(activeIndex()).toBe(COUNT - 1);

    await fireEvent.keyDown(prev, { key: "ArrowLeft" });
    expect(activeIndex()).toBe(COUNT - 2);
    expect(next).toBeEnabled();
  });

  it("hands focus to the opposite paddle when the pressed one reaches its boundary", async () => {
    const { prev, next } = mount();

    next.focus();
    for (let step = 0; step < COUNT - 1; step += 1) {
      await fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    }

    expect(next).toBeDisabled();
    expect(document.activeElement).toBe(prev);
  });
});
