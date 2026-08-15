import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";

vi.mock("maplibre-gl", async () =>
  (await import("../../test/mocks/maplibre")).createMapLibreMock(),
);
vi.mock("pmtiles", async () =>
  (await import("../../test/mocks/maplibre")).createPMTilesMock(),
);

import {
  mapEaseTo,
  mapInit,
  mapJumpTo,
  mapRemove,
  mapSetMaxBounds,
  mapSetStyle,
  mapView,
  markerElements,
  resetMapLibreMock,
} from "../../test/mocks/maplibre";
import { EXPERIENCES } from "./experiences";
import ExperienceMap from "./ExperienceMap.svelte";

afterEach(() => {
  vi.useRealTimers();
  resetMapLibreMock();
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

  it("eases straight in from the opening zoom, and swaps tiles, bounds, and viewpoint across cities", async () => {
    vi.useFakeTimers();
    const { rerender } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    resetMapLibreMock();
    await rerender({
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.runAllTimersAsync();

    expect(mapEaseTo).toHaveBeenCalledTimes(1);
    expect(mapEaseTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [74.4, 31.5], zoom: 13 }),
    );
    expect(mapSetStyle).not.toHaveBeenCalled();
    vi.useRealTimers();

    resetMapLibreMock();
    await rerender({
      focus: { lng: 72.9918, lat: 33.6448, city: "islamabad" },
      selectedId: "nust",
    });
    await vi.waitFor(() => expect(mapSetStyle).toHaveBeenCalled());

    expect(JSON.stringify(mapSetStyle.mock.calls[0])).toContain(
      "islamabad.pmtiles",
    );
    expect(mapSetMaxBounds).toHaveBeenCalledWith([
      [72.9, 33.52],
      [73.25, 33.78],
    ]);

    expect(mapJumpTo).toHaveBeenCalledWith({
      center: [72.9918, 33.6448],
      zoom: 11.5,
    });
    expect(mapEaseTo).not.toHaveBeenCalled();

    resetMapLibreMock();
    await rerender({
      focus: { lng: 74.423, lat: 31.4683, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.waitFor(() => expect(mapSetStyle).toHaveBeenCalled());
    expect(JSON.stringify(mapSetStyle.mock.calls[0])).toContain(
      "lahore.pmtiles",
    );
  });

  it("pulls back before settling once the map is already zoomed in", async () => {
    vi.useFakeTimers();
    const { rerender } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    await rerender({
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.runAllTimersAsync();
    expect(mapView.zoom).toBe(13);

    resetMapLibreMock();
    await rerender({
      focus: { lng: 74.423, lat: 31.4683, city: "lahore" },
      selectedId: "carbonteq",
    });

    expect(mapEaseTo.mock.calls[0][0]).toEqual(
      expect.objectContaining({ zoom: 11.9 }),
    );
    expect(mapEaseTo.mock.calls[0][0]).not.toHaveProperty("center");

    await vi.runAllTimersAsync();
    expect(mapEaseTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: [74.423, 31.4683], zoom: 13 }),
    );
  });

  it("skips the pull-back when the visitor has already zoomed near it", async () => {
    vi.useFakeTimers();
    const { rerender } = render(ExperienceMap, {
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.runAllTimersAsync();

    resetMapLibreMock();
    mapView.zoom = 12;
    await rerender({
      focus: { lng: 74.423, lat: 31.4683, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.runAllTimersAsync();

    expect(mapEaseTo).toHaveBeenCalledTimes(1);
    expect(mapEaseTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [74.423, 31.4683], zoom: 13 }),
    );
  });

  it("marks only the selected experience, so exactly one ring is drawn", () => {
    render(ExperienceMap, {
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });

    const pins = markerElements.filter((el) =>
      el.classList.contains("map-pin"),
    );
    expect(pins).toHaveLength(EXPERIENCES.length);
    expect(pins.filter((el) => el.classList.contains("selected"))).toHaveLength(
      1,
    );
  });

  it("shows the fallback state when the map cannot initialize", () => {
    mapInit.throwOnConstruct = true;
    const { container } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    expect(container.querySelector(".map")).toBeNull();
    expect(container.querySelector(".fallback")!.textContent).toContain(
      "MAP UNAVAILABLE",
    );
  });

  it("lets the latest focus cancel a city swap before stale tiles apply", async () => {
    vi.useFakeTimers();
    const { rerender } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    resetMapLibreMock();

    await rerender({
      focus: { lng: 72.9918, lat: 33.6448, city: "islamabad" },
      selectedId: "nust",
    });
    await rerender({
      focus: { lng: 74.4, lat: 31.5, city: "lahore" },
      selectedId: "carbonteq",
    });
    await vi.runAllTimersAsync();

    expect(mapSetStyle).not.toHaveBeenCalled();
    expect(mapEaseTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: [74.4, 31.5] }),
    );
  });

  it("cancels dissolve work when unmounted", async () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(ExperienceMap, {
      focus: null,
      selectedId: null,
    });
    resetMapLibreMock();
    await rerender({
      focus: { lng: 72.9918, lat: 33.6448, city: "islamabad" },
      selectedId: "nust",
    });
    await unmount();
    await vi.runAllTimersAsync();
    expect(mapSetStyle).not.toHaveBeenCalled();
    expect(mapRemove).toHaveBeenCalledTimes(1);
  });
});
