export interface AMapMap {
  setFitView(
    overlays?: unknown[],
    immediately?: boolean,
    avoid?: [number, number, number, number],
    maxZoom?: number,
  ): void;
  setZoomAndCenter(
    zoom: number,
    center: [number, number],
    immediately?: boolean,
    duration?: number,
  ): void;
  getZoom(): number;
  on(event: "complete", handler: () => void): void;
  resize(): void;
  destroy(): void;
}

export interface AMapMarker {
  on(event: "click", handler: () => void): void;
  setMap(map: AMapMap | null): void;
}

export interface AMapInfoWindow {
  setContent(content: string): void;
  open(map: AMapMap, position: [number, number]): void;
  close(): void;
}

export interface AMapOverlay {
  setMap(map: AMapMap | null): void;
}

export interface AMapRouteStep {
  path: [number, number][];
}

export interface AMapRoute {
  distance: number;
  time: number;
  steps: AMapRouteStep[];
}

export interface AMapRouteResult {
  routes: AMapRoute[];
}

export interface AMapRouteService {
  search(
    origin: [number, number],
    destination: [number, number],
    callback: (status: string, result: AMapRouteResult | string) => void,
  ): void;
}

export interface AMapNamespace {
  Map: new (container: HTMLElement, options?: Record<string, unknown>) => AMapMap;
  Marker: new (options: Record<string, unknown>) => AMapMarker;
  InfoWindow: new (options?: Record<string, unknown>) => AMapInfoWindow;
  Pixel: new (x: number, y: number) => unknown;
  plugin(names: string[], callback: () => void): void;
  Polyline: new (options: Record<string, unknown>) => AMapOverlay;
  Text: new (options: Record<string, unknown>) => AMapOverlay;
  Driving: new (options?: Record<string, unknown>) => AMapRouteService;
  Walking: new (options?: Record<string, unknown>) => AMapRouteService;
}

declare global {
  interface Window {
    AMap?: AMapNamespace;
    _AMapSecurityConfig?: { securityJsCode?: string };
  }
}

let loading: Promise<AMapNamespace> | null = null;

export function amapJsKey(): string | undefined {
  return import.meta.env.VITE_AMAP_JS_KEY as string | undefined;
}

export function loadAmap(): Promise<AMapNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("amap-ssr"));
  }
  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }
  if (loading) {
    return loading;
  }
  const key = amapJsKey();
  if (!key) {
    return Promise.reject(new Error("amap-missing-key"));
  }
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined;
  if (securityCode) {
    window._AMapSecurityConfig = { securityJsCode: securityCode };
  }
  loading = new Promise<AMapNamespace>((resolve, reject) => {
    const existing = document.getElementById("amap-jsapi-script");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.AMap) {
          resolve(window.AMap);
        } else {
          reject(new Error("amap-unavailable"));
        }
      });
      existing.addEventListener("error", () => reject(new Error("amap-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = "amap-jsapi-script";
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap);
      } else {
        script.remove();
        reject(new Error("amap-unavailable"));
      }
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("amap-load-failed"));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}
