import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationSummary } from "../../../queries/locations";
import {
  loadAmap,
  type AMapInfoWindow,
  type AMapMap,
  type AMapMarker,
  type AMapNamespace,
} from "../../../lib/amap/loader";

type MapStatus = "loading" | "ready" | "missing-key" | "error";

const FOCUS_ZOOM = 15;
const CAMERA_DURATION_MS = 600;
const TILE_READY_TIMEOUT_MS = 4000;

interface LocationMapProps {
  points: LocationSummary[];
  typeLabel: string;
  anchorName?: string | null;
  focusPoiId?: string | null;
  showInfoWindow?: boolean;
  onSelect?: (poiId: string) => void;
  onOpenDetail?: (poiId: string) => void;
  loading?: boolean;
  className?: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function infoHtml(
  point: LocationSummary,
  typeLabel: string,
  anchorName?: string | null,
): string {
  const distance =
    point.distanceMeters != null && anchorName
      ? `<div style="margin-top:4px;color:#666">距${escapeHtml(anchorName)}约 ${(point.distanceMeters / 1000).toFixed(1)}km</div>`
      : "";
  return `<div style="min-width:180px;padding:2px 4px 14px;font-size:12px;line-height:1.5;animation:map-card-in 180ms cubic-bezier(0.22,1,0.36,1) both">
    <div style="font-weight:600;font-size:13px">${escapeHtml(point.name)}</div>
    <div style="color:#666">${escapeHtml(typeLabel)} · ${escapeHtml(point.address ?? "地址未收录")}</div>
    ${distance}
    <div style="margin-top:8px">
      <button type="button" data-map-detail-poi-id="${escapeHtml(point.poiId)}" style="position:relative;z-index:1;border:0;border-radius:6px;background:#111827;color:#fff;padding:4px 10px;font-size:12px;cursor:pointer">查看详情</button>
    </div>
  </div>`;
}

function MapFallback({ title, description }: { title: string; description: string }) {
  return (
    <div
      data-testid="location-map-placeholder"
      className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30 p-6 text-center"
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function MapLoadingOverlay({ visible, label }: { visible: boolean; label: string }) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "map-skeleton absolute inset-0",
          !visible && "[animation-play-state:paused]",
        )}
      />
      <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/85 px-7 py-6 shadow-lg backdrop-blur-sm">
        <span className="relative flex size-10 items-center justify-center">
          <span className="map-pulse absolute inset-0 rounded-full bg-primary/10" />
          <span className="absolute size-12 animate-spin rounded-full border-2 border-primary/15 border-t-primary/80 [animation-duration:1.1s] motion-reduce:animate-none" />
          <MapPinned className="size-5 text-primary" />
        </span>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function LocationMap({
  points,
  typeLabel,
  anchorName,
  focusPoiId,
  showInfoWindow = true,
  onSelect,
  onOpenDetail,
  loading = false,
  className,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const markersRef = useRef(new Map<string, AMapMarker>());
  const infoWindowRef = useRef<AMapInfoWindow | null>(null);
  const pointsRef = useRef(points);
  const onSelectRef = useRef(onSelect);
  const onOpenDetailRef = useRef(onOpenDetail);
  const typeLabelRef = useRef(typeLabel);
  const anchorNameRef = useRef(anchorName);
  const showInfoWindowRef = useRef(showInfoWindow);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [tilesReady, setTilesReady] = useState(false);

  pointsRef.current = points;
  onSelectRef.current = onSelect;
  onOpenDetailRef.current = onOpenDetail;
  typeLabelRef.current = typeLabel;
  anchorNameRef.current = anchorName;
  showInfoWindowRef.current = showInfoWindow;
  const pointsKey = points
    .map((point) => `${point.poiId}:${point.longitude ?? ""}:${point.latitude ?? ""}`)
    .join("|");

  useEffect(() => {
    let cancelled = false;
    let readyTimer: number | undefined;
    loadAmap()
      .then((amap) => {
        if (cancelled || !containerRef.current) {
          return;
        }
        amapRef.current = amap;
        const map = new amap.Map(containerRef.current, {
          zoom: 12,
          center: [113.58, 22.27],
          viewMode: "2D",
        });
        mapRef.current = map;
        map.on("complete", () => {
          if (!cancelled) {
            setTilesReady(true);
          }
        });
        readyTimer = window.setTimeout(() => {
          if (!cancelled) {
            setTilesReady(true);
          }
        }, TILE_READY_TIMEOUT_MS);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setStatus(
          error instanceof Error && error.message === "amap-missing-key" ? "missing-key" : "error",
        );
      });
    return () => {
      cancelled = true;
      window.clearTimeout(readyTimer);
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      infoWindowRef.current?.close();
      mapRef.current?.destroy();
      mapRef.current = null;
      amapRef.current = null;
      infoWindowRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) {
      return;
    }
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [status]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const trigger = target.closest<HTMLElement>("[data-map-detail-poi-id]");
      const poiId = trigger?.dataset.mapDetailPoiId;
      if (!poiId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      infoWindowRef.current?.close();
      onOpenDetailRef.current?.(poiId);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (status !== "ready" || !tilesReady) {
      return;
    }
    const map = mapRef.current;
    const amap = amapRef.current;
    if (!map || !amap) {
      return;
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    infoWindowRef.current?.close();
    infoWindowRef.current = new amap.InfoWindow({
      offset: new amap.Pixel(0, -28),
      autoMove: false,
    });
    const markers: AMapMarker[] = [];
    for (const point of pointsRef.current) {
      if (point.longitude == null || point.latitude == null) {
        continue;
      }
      const marker = new amap.Marker({
        position: [point.longitude, point.latitude],
        title: point.name,
      });
      marker.on("click", () => onSelectRef.current?.(point.poiId));
      marker.setMap(map);
      markersRef.current.set(point.poiId, marker);
      markers.push(marker);
    }
    if (markers.length > 0) {
      map.setFitView(markers, false, [56, 56, 56, 56], FOCUS_ZOOM);
    }
  }, [status, tilesReady, pointsKey]);

  useEffect(() => {
    if (status !== "ready" || !tilesReady) {
      return;
    }
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) {
      return;
    }
    if (!focusPoiId) {
      infoWindow.close();
      return;
    }
    const point = pointsRef.current.find((candidate) => candidate.poiId === focusPoiId);
    if (!point || point.longitude == null || point.latitude == null) {
      infoWindow.close();
      return;
    }
    const position: [number, number] = [point.longitude, point.latitude];
    map.setZoomAndCenter(
      Math.max(FOCUS_ZOOM, map.getZoom()),
      position,
      false,
      CAMERA_DURATION_MS,
    );
    if (!showInfoWindowRef.current) {
      infoWindow.close();
      return;
    }
    infoWindow.setContent(infoHtml(point, typeLabelRef.current, anchorNameRef.current));
    infoWindow.open(map, position);
  }, [status, tilesReady, focusPoiId, pointsKey, typeLabel, anchorName, showInfoWindow]);

  const busy = status === "loading" || !tilesReady;
  const refreshing = !busy && loading;

  if (status === "missing-key") {
    return (
      <MapFallback
        title="地图未配置"
        description="请设置 VITE_AMAP_JS_KEY 和 VITE_AMAP_SECURITY_CODE 后刷新页面。"
      />
    );
  }
  if (status === "error") {
    return (
      <MapFallback title="地图加载失败" description="请检查网络或高德 JS API Key 配置。" />
    );
  }

  return (
    <div
      className={cn(
        "relative h-full min-h-[320px] overflow-hidden rounded-xl border bg-muted/30",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        data-testid="location-map"
        aria-label="地点地图"
      />
      <MapLoadingOverlay visible={busy} label="正在加载地图…" />
      <div
        aria-hidden={!refreshing}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center transition-opacity duration-300",
          refreshing ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="flex items-center gap-2 rounded-full border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          <LoaderCircle className="size-3.5 animate-spin [animation-duration:0.9s] motion-reduce:animate-none" />
          正在更新点位…
        </span>
      </div>
      {status === "ready" && !busy && !refreshing && points.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs text-muted-foreground">
          当前筛选暂无地图点位
        </div>
      ) : null}
    </div>
  );
}
