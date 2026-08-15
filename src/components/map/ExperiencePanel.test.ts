import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { EXPERIENCES } from "./experiences";

vi.mock("maplibre-gl", async () =>
  (await import("../../test/mocks/maplibre")).createMapLibreMock(),
);
vi.mock("pmtiles", async () =>
  (await import("../../test/mocks/maplibre")).createPMTilesMock(),
);

import { mapEaseTo, resetMapLibreMock } from "../../test/mocks/maplibre";
import ExperiencePanel from "./ExperiencePanel.svelte";

afterEach(resetMapLibreMock);

describe("ExperiencePanel", () => {
  it("points the map at the entry the pager selected", async () => {
    const { container, getByRole } = render(ExperiencePanel);
    await waitFor(() => expect(container.querySelector(".map")).not.toBeNull());

    const newest = EXPERIENCES[0].location;
    await waitFor(() =>
      expect(mapEaseTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [newest.lng, newest.lat] }),
      ),
    );

    await fireEvent.click(getByRole("button", { name: "Next experience" }));

    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      EXPERIENCES[1].title,
    );
  });
});
