import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { EXPERIENCES } from "./experiences";

const h = vi.hoisted(() => ({ flyTo: vi.fn() }));

vi.mock("maplibre-gl", () => {
  class Marker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  class Map {
    touchZoomRotate = { disableRotation() {} };
    keyboard = { disable() {} };
    on() {
      return this;
    }
    flyTo = h.flyTo;
    setPixelRatio() {}
    remove() {}
  }
  const addProtocol = vi.fn();
  return { default: { Map, Marker, addProtocol }, Map, Marker, addProtocol };
});
vi.mock("pmtiles", () => ({
  Protocol: class {
    tile = () => {};
  },
}));

import ExperiencePanel from "./ExperiencePanel.svelte";

describe("ExperiencePanel", () => {
  it("clicking an entry selects it and flies the map to its location", async () => {
    const { container } = render(ExperiencePanel);
    await waitFor(() => expect(container.querySelector(".map")).not.toBeNull());

    const first = container.querySelector(".entry") as HTMLButtonElement;
    await fireEvent.click(first);

    expect(first.classList.contains("selected")).toBe(true);
    const loc = EXPERIENCES[0].location;
    await waitFor(() =>
      expect(h.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [loc.lng, loc.lat] }),
      ),
    );
  });
});
