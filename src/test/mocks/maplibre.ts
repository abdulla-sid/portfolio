import { vi } from "vitest";

export const mapFlyTo = vi.fn();
export const mapEaseTo = vi.fn();
export const mapSetStyle = vi.fn();
export const mapSetMaxBounds = vi.fn();
export const mapJumpTo = vi.fn();
export const mapRemove = vi.fn();

export const mapInit = { throwOnConstruct: false };
export const mapView = { zoom: 0, minZoom: 0 };
export const markerElements: HTMLElement[] = [];

interface CameraOptions {
  zoom?: number;
  minZoom?: number;
}

export function createMapLibreMock() {
  class Marker {
    constructor(options?: { element?: HTMLElement }) {
      if (options?.element) markerElements.push(options.element);
    }
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
    constructor(options?: CameraOptions) {
      if (mapInit.throwOnConstruct) throw new Error("no webgl");
      if (options?.zoom !== undefined) mapView.zoom = options.zoom;
      if (options?.minZoom !== undefined) mapView.minZoom = options.minZoom;
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
    flyTo = (options?: CameraOptions) => {
      if (options?.zoom !== undefined) mapView.zoom = options.zoom;
      return mapFlyTo(options);
    };
    easeTo = (options?: CameraOptions) => {
      if (options?.zoom !== undefined) mapView.zoom = options.zoom;
      return mapEaseTo(options);
    };
    jumpTo = (options?: CameraOptions) => {
      if (options?.zoom !== undefined) mapView.zoom = options.zoom;
      return mapJumpTo(options);
    };
    getZoom = () => mapView.zoom;
    getMinZoom = () => mapView.minZoom;
    setStyle = mapSetStyle;
    setMaxBounds = mapSetMaxBounds;
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
  mapEaseTo.mockClear();
  mapSetStyle.mockClear();
  mapSetMaxBounds.mockClear();
  mapJumpTo.mockClear();
  mapRemove.mockClear();
  markerElements.length = 0;
  mapInit.throwOnConstruct = false;
}
