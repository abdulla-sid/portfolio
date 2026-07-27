import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { EXPERIENCES } from "./experiences";

vi.mock("maplibre-gl", async () =>
  (await import("../../test/mocks/maplibre")).createMapLibreMock(),
);
vi.mock("pmtiles", async () =>
  (await import("../../test/mocks/maplibre")).createPMTilesMock(),
);

import { mapFlyTo, resetMapLibreMock } from "../../test/mocks/maplibre";
import ExperiencePanel from "./ExperiencePanel.svelte";

const LAST = EXPERIENCES.length - 1;

afterEach(resetMapLibreMock);

describe("ExperiencePanel", () => {
  it("steps through entries with the arrow keys without wrapping past either end", async () => {
    const { container, getByRole } = render(ExperiencePanel);
    await waitFor(() => expect(container.querySelector(".map")).not.toBeNull());

    const newer = getByRole("button", { name: "Previous experience" });
    const older = getByRole("button", { name: "Next experience" });

    const newest = EXPERIENCES[0].location;
    await waitFor(() =>
      expect(mapFlyTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [newest.lng, newest.lat] }),
      ),
    );
    expect(newer).toBeDisabled();

    await fireEvent.keyDown(older, { key: "ArrowRight" });
    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      EXPERIENCES[1].title,
    );

    await fireEvent.keyDown(older, { key: "ArrowRight" });
    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      EXPERIENCES[LAST].title,
    );
    expect(older).toBeDisabled();

    await fireEvent.keyDown(newer, { key: "ArrowRight" });
    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      EXPERIENCES[LAST].title,
    );

    await fireEvent.keyDown(newer, { key: "ArrowLeft" });
    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      EXPERIENCES[LAST - 1].title,
    );
    expect(older).toBeEnabled();
  });

  it("hands focus to the opposite paddle when the pressed one reaches its boundary", async () => {
    const { container, getByRole } = render(ExperiencePanel);
    await waitFor(() => expect(container.querySelector(".map")).not.toBeNull());

    const newer = getByRole("button", { name: "Previous experience" });
    const older = getByRole("button", { name: "Next experience" });

    older.focus();
    for (let step = 0; step < LAST; step += 1) {
      await fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    }

    expect(older).toBeDisabled();
    expect(document.activeElement).toBe(newer);

    await fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      EXPERIENCES[LAST - 1].title,
    );
  });
});
