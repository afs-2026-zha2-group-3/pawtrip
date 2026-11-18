import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationMap } from "./-location-map";

const { resize, MockMap, MockMarker, MockInfoWindow } = vi.hoisted(() => {
  const resize = vi.fn();
  class MockMap {
    setFitView = vi.fn();
    setZoomAndCenter = vi.fn();
    getZoom = vi.fn(() => 12);
    on = vi.fn();
    resize = resize;
    destroy = vi.fn();
  }
  class MockMarker {
    on = vi.fn();
    setMap = vi.fn();
  }
  class MockInfoWindow {
    setContent = vi.fn();
    open = vi.fn();
    close = vi.fn();
  }
  return { resize, MockMap, MockMarker, MockInfoWindow };
});

vi.mock("../../../lib/amap/loader", () => ({
  loadAmap: () =>
    Promise.resolve({
      Map: MockMap,
      Marker: MockMarker,
      InfoWindow: MockInfoWindow,
      Pixel: class {},
    }),
}));

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn(() => {
    this.disconnected = true;
  });
  private disconnected = false;
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  trigger() {
    if (!this.disconnected) {
      this.callback([], this as unknown as ResizeObserver);
    }
  }
}

beforeEach(() => {
  MockResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocationMap", () => {
  it("resizes the map when its container changes size", async () => {
    const { unmount } = render(<LocationMap points={[]} typeLabel="景点" />);

    await waitFor(() => {
      expect(MockResizeObserver.instances).toHaveLength(1);
    });
    const observer = MockResizeObserver.instances[0];
    expect(observer.observe).toHaveBeenCalledWith(screen.getByTestId("location-map"));

    observer.trigger();
    expect(resize).toHaveBeenCalledTimes(1);

    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
    observer.trigger();
    expect(resize).toHaveBeenCalledTimes(1);
  });
});
