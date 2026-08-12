import { vi } from "vitest";

export const mediaPlay = vi.fn(async () => {});
export const mediaPause = vi.fn();
export const mediaLoad = vi.fn();
export const canvasClearRect = vi.fn();
export const canvasFillRect = vi.fn();

const canvasContext = {
  clearRect: canvasClearRect,
  fillRect: canvasFillRect,
  fillStyle: "",
};

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function createMediaQueryList(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

export function installBrowserMocks() {
  if (typeof HTMLMediaElement !== "undefined") {
    Object.defineProperties(HTMLMediaElement.prototype, {
      play: { configurable: true, value: mediaPlay },
      pause: { configurable: true, value: mediaPause },
      load: { configurable: true, value: mediaLoad },
    });
  }

  if (typeof HTMLCanvasElement !== "undefined") {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn((contextId: string) => {
        if (contextId !== "2d") {
          throw new Error(`Unsupported canvas context in tests: ${contextId}`);
        }
        return canvasContext;
      }),
    });
  }

  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    value: vi.fn(createMediaQueryList),
  });

  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: ResizeObserverStub,
  });

  if (typeof document !== "undefined" && !document.fonts) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: Promise.resolve() },
    });
  }
}

export function resetBrowserMocks() {
  mediaPlay.mockClear();
  mediaPause.mockClear();
  mediaLoad.mockClear();
  canvasClearRect.mockClear();
  canvasFillRect.mockClear();
}
