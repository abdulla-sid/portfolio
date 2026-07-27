import { vi } from "vitest";

export const mapFlyTo = vi.fn();
export const mapSetStyle = vi.fn();
export const mapSetMaxBounds = vi.fn();
export const mapJumpTo = vi.fn();
export const mapRemove = vi.fn();

export const mapInit = { throwOnConstruct: false };

export function createMapLibreMock() {
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
      if (mapInit.throwOnConstruct) throw new Error("no webgl");
    }
    on() {
      return this;
    }
    once(_event: string, listener: () => void) {
      listener();
      return this;
    }
    off() {
      return this;
    }
    setPixelRatio() {}
    flyTo = mapFlyTo;
    setStyle = mapSetStyle;
    setMaxBounds = mapSetMaxBounds;
    jumpTo = mapJumpTo;
    remove = mapRemove;
  }

  const addProtocol = vi.fn();
  return { default: { Map, Marker, addProtocol }, Map, Marker, addProtocol };
}

export function createPMTilesMock() {
  return {
    Protocol: class {
      tile = () => {};
    },
  };
}

export function resetMapLibreMock() {
  mapFlyTo.mockClear();
  mapSetStyle.mockClear();
  mapSetMaxBounds.mockClear();
  mapJumpTo.mockClear();
  mapRemove.mockClear();
  mapInit.throwOnConstruct = false;
}
