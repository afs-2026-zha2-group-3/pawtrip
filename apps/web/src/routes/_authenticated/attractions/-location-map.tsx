import { useEffect, useRef, useState } from "react";
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
  return `<div style="min-width:180px;padding:2px 4px 14px;font-size:12px;line-height:1.5">
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
    loadAmap()
      .then((amap) => {
        if (cancelled || !containerRef.current) {
          return;
        }
        amapRef.current = amap;
        mapRef.current = new amap.Map(containerRef.current, {
          zoom: 12,
          center: [113.58, 22.27],
          viewMode: "2D",
        });
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
    if (status !== "ready") {
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
    infoWindowRef.current = new amap.InfoWindow({ offset: new amap.Pixel(0, -28) });
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
      map.setFitView(markers);
    }
  }, [status, pointsKey]);

  useEffect(() => {
    if (status !== "ready") {
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
    map.setZoomAndCenter(15, [point.longitude, point.latitude]);
    if (!showInfoWindowRef.current) {
      infoWindow.close();
      return;
    }
    infoWindow.setContent(infoHtml(point, typeLabelRef.current, anchorNameRef.current));
    infoWindow.open(map, [point.longitude, point.latitude]);
  }, [status, focusPoiId, pointsKey, typeLabel, anchorName, showInfoWindow]);

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
      {status === "loading" || loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground">
          正在加载地图…
        </div>
      ) : null}
      {status === "ready" && !loading && points.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs text-muted-foreground">
          当前筛选暂无地图点位
        </div>
      ) : null}
    </div>
  );
}
