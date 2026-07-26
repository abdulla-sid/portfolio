import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";

const h = vi.hoisted(() => ({
  flyTo: vi.fn(),
  setStyle: vi.fn(),
  setMaxBounds: vi.fn(),
  jumpTo: vi.fn(),
  throwOnInit: false,
  remove: vi.fn(),
}));

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
    constructor() {
      if (h.throwOnInit) throw new Error("no webgl");
    }
    on() {
      return this;
    }

    once(_event: string, cb: () => void) {
      cb();
      return this;
    }
    off() {
      return this;
    }
    flyTo = h.flyTo;
    setStyle = h.setStyle;
    setMaxBounds = h.setMaxBounds;
    jumpTo = h.jumpTo;
    remove = h.remove;
  }
  const addProtocol = vi.fn();
  return { default: { Map, Marker, addProtocol }, Map, Marker, addProtocol };
});
vi.mock("pmtiles", () => ({
  Protocol: class {
    tile = () => {};
  },
}));

import ExperienceMap from "./ExperienceMap.svelte";

afterEach(() => {
  vi.useRealTimers();
  h.remove.mockClear();
});

describe("ExperienceMap", () => {
  it("renders linked attribution, then collapses it to a disclosure control", async () => {
    vi.useFakeTimers();
    const { container, getByRole } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    expect(container.querySelector(".map")).toHaveAttribute("data-no-drag");
    expect(getByRole("link", { name: "OpenStreetMap" })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright",
    );

    const disclosure = getByRole("button", { name: "Map attribution" });
    expect(disclosure).toHaveAttribute("aria-expanded", "true");

    await vi.advanceTimersByTimeAsync(5000);
    await tick();
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(
      container.querySelector('a[href*="openstreetmap.org/copyright"]'),
    ).toBeNull();

    await fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(getByRole("link", { name: "OpenStreetMap" })).toBeInTheDocument();
  });

  it("flies within a city and swaps tiles, bounds, and viewpoint across cities", async () => {
    const { rerender } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    h.flyTo.mockClear();
    h.setStyle.mockClear();
    await rerender({
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });
    expect(h.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [74.4, 31.5] }),
    );
    expect(h.setStyle).not.toHaveBeenCalled();

    h.flyTo.mockClear();
    h.setStyle.mockClear();
    h.setMaxBounds.mockClear();
    h.jumpTo.mockClear();
    await rerender({
      focus: { lng: 72.9918, lat: 33.6448, city: "islamabad" },
      selectedId: "nust",
    });
    await vi.waitFor(() => expect(h.setStyle).toHaveBeenCalled());

    expect(JSON.stringify(h.setStyle.mock.calls[0])).toContain(
      "islamabad.pmtiles",
    );
    expect(h.setMaxBounds).toHaveBeenCalledWith([
      [72.9, 33.52],
      [73.25, 33.78],
    ]);

    expect(h.jumpTo).toHaveBeenCalledWith({
      center: [72.9918, 33.6448],
      zoom: 11.5,
    });
    expect(h.flyTo).not.toHaveBeenCalled();

    h.setStyle.mockClear();
    await rerender({
      focus: { lng: 74.423, lat: 31.4683, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.waitFor(() => expect(h.setStyle).toHaveBeenCalled());
    expect(JSON.stringify(h.setStyle.mock.calls[0])).toContain(
      "lahore.pmtiles",
    );
  });

  it("shows the fallback state when the map cannot initialize", () => {
    h.throwOnInit = true;
    const { container } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    expect(container.querySelector(".map")).toBeNull();
    expect(container.querySelector(".fallback")!.textContent).toContain(
      "MAP UNAVAILABLE",
    );
    h.throwOnInit = false;
  });

  it("lets the latest focus cancel a city swap before stale tiles apply", async () => {
    vi.useFakeTimers();
    const { rerender } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    h.flyTo.mockClear();
    h.setStyle.mockClear();

    await rerender({
      focus: { lng: 72.9918, lat: 33.6448, city: "islamabad" },
      selectedId: "nust",
    });
    await rerender({
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.runAllTimersAsync();

    expect(h.setStyle).not.toHaveBeenCalled();
    expect(h.flyTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: [74.4, 31.5] }),
    );
  });

  it("cancels dissolve work when unmounted", async () => {
    vi.useFakeTimers();
    h.remove.mockClear();
    const { rerender, unmount } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    h.setStyle.mockClear();
    await rerender({
      focus: { lng: 72.9918, lat: 33.6448, city: "islamabad" },
      selectedId: "nust",
    });
    await unmount();
    await vi.runAllTimersAsync();
    expect(h.setStyle).not.toHaveBeenCalled();
    expect(h.remove).toHaveBeenCalledTimes(1);
  });
});
