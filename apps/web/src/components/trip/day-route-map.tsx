import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  loadAmap,
  type AMapMap,
  type AMapNamespace,
  type AMapOverlay,
  type AMapRouteResult,
} from "@/lib/amap/loader";
import {
  DAY_ROUTE_FAILED_TEXT,
  DAY_ROUTE_LOADING_TEXT,
  DAY_ROUTE_MISSING_KEY_TEXT,
  DAY_ROUTE_MISSING_TEXT,
  DAY_ROUTE_PARTIAL_FAILED_TEXT,
  formatRouteLabel,
  routeMinutesFromSeconds,
  type DayRoute,
  type DayRouteSegment,
} from "@/lib/trip/day-route";

type MapStatus = "loading" | "ready" | "missing-key" | "error";
type RouteFailure = "none" | "partial" | "all";

const DRIVE_COLOR = "#f97316";
const WALK_COLOR = "#2563eb";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
}

function stopLabelContent(stop: { number: number; name: string }) {
  return [
    '<div style="display:flex;align-items:center;gap:4px;white-space:nowrap;">',
    '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 4px;border-radius:6px;background:#2563eb;color:#ffffff;font-size:12px;font-weight:600;">',
    String(stop.number),
    "</span>",
    '<span style="padding:2px 8px;border:1px solid #d4d4d8;border-radius:9999px;background:#ffffff;color:#18181b;font-size:12px;">',
    escapeHtml(stop.name),
    "</span>",
    "</div>",
  ].join("");
}

function RouteFallback({ title }: { title: string }) {
  return (
    <div
      data-testid="day-route-placeholder"
      className="flex min-h-[420px] w-full flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30 p-6 text-center"
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        行程单其他内容不受影响，可稍后重试。
      </p>
    </div>
  );
}

export function DayRouteMap({ route }: { route: DayRoute }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const overlaysRef = useRef<AMapOverlay[]>([]);
  const routeRef = useRef(route);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [failure, setFailure] = useState<RouteFailure>("none");
  const [pending, setPending] = useState(false);

  routeRef.current = route;
  const routeKey = [
    route.stops
      .map((stop) => `${stop.poiId}:${stop.longitude ?? ""}:${stop.latitude ?? ""}`)
      .join("|"),
    route.segments
      .map(
        (segment) =>
          `${segment.key}:${segment.mode}:${segment.drawable}:${segment.estimateMinutes ?? ""}`,
      )
      .join("|"),
  ].join("/");

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
          viewMode: "2D",
        });
        amap.plugin(["AMap.Driving", "AMap.Walking"], () => {
          if (!cancelled) {
            setStatus("ready");
          }
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setStatus(
          error instanceof Error && error.message === "amap-missing-key"
            ? "missing-key"
            : "error",
        );
      });
    return () => {
      cancelled = true;
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
      amapRef.current = null;
    };
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
    let cancelled = false;
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    setFailure("none");

    const overlays: AMapOverlay[] = overlaysRef.current;
    const plan = routeRef.current;
    for (const stop of plan.stops) {
      if (stop.longitude == null || stop.latitude == null) {
        continue;
      }
      const marker = new amap.Marker({
        position: [stop.longitude, stop.latitude],
        title: stop.name,
        label: {
          content: stopLabelContent(stop),
          direction: "center",
        },
      });
      marker.setMap(map);
      overlays.push(marker);
    }

    const drawable = plan.segments.filter(
      (segment): segment is DayRouteSegment => segment.drawable,
    );
    if (drawable.length === 0) {
      setPending(false);
      map.setFitView(overlays);
      return;
    }

    setPending(true);
    let done = 0;
    let failed = 0;
    const finish = () => {
      if (cancelled) {
        return;
      }
      setPending(false);
      setFailure(
        failed === 0 ? "none" : failed === drawable.length ? "all" : "partial",
      );
      map.setFitView(overlays);
    };

    for (const segment of drawable) {
      const from = plan.stops.find((stop) => stop.poiId === segment.fromPoiId);
      const to = plan.stops.find((stop) => stop.poiId === segment.toPoiId);
      if (
        !from ||
        !to ||
        from.longitude == null ||
        from.latitude == null ||
        to.longitude == null ||
        to.latitude == null
      ) {
        failed += 1;
        done += 1;
        if (done === drawable.length) {
          finish();
        }
        continue;
      }
      const Service =
        segment.mode === "walk" ? amap.Walking : amap.Driving;
      const service = new Service({});
      service.search(
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
        (statusText, result) => {
          if (cancelled) {
            return;
          }
          done += 1;
          const routeResult =
            statusText === "complete" && typeof result !== "string"
              ? (result as AMapRouteResult)
              : null;
          const best = routeResult?.routes?.[0];
          if (!best || best.steps.length === 0) {
            failed += 1;
          } else {
            const path = best.steps.flatMap((step) => step.path);
            const line = new amap.Polyline({
              path,
              strokeColor: segment.mode === "walk" ? WALK_COLOR : DRIVE_COLOR,
              strokeWeight: 5,
              strokeOpacity: 0.9,
            });
            line.setMap(map);
            overlays.push(line);
            const midpoint = path[Math.floor(path.length / 2)];
            if (midpoint) {
              const minutes =
                segment.estimateMinutes ?? routeMinutesFromSeconds(best.time);
              const text = new amap.Text({
                text: formatRouteLabel(best.distance, minutes),
                position: midpoint,
                style: {
                  "background-color": "#ffffff",
                  border: "1px solid #d4d4d8",
                  "border-radius": "9999px",
                  padding: "2px 8px",
                  "font-size": "12px",
                  color: "#18181b",
                },
              });
              text.setMap(map);
              overlays.push(text);
            }
          }
          if (done === drawable.length) {
            finish();
          }
        },
      );
    }

    return () => {
      cancelled = true;
    };
  }, [status, routeKey]);

  if (status === "missing-key") {
    return <RouteFallback title={DAY_ROUTE_MISSING_KEY_TEXT} />;
  }
  if (status === "error") {
    return <RouteFallback title="路线地图加载失败" />;
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        data-testid="day-route-map"
        aria-label="当天路线地图"
        className={cn(
          "h-[420px] w-full overflow-hidden rounded-xl border bg-muted/30",
        )}
      />
      {pending ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground">
          {DAY_ROUTE_LOADING_TEXT}
        </div>
      ) : null}
      {failure !== "none" ? (
        <p
          role="status"
          className="mt-2 text-xs text-destructive"
          data-testid="day-route-failure"
        >
          {failure === "all"
            ? DAY_ROUTE_FAILED_TEXT
            : DAY_ROUTE_PARTIAL_FAILED_TEXT}
        </p>
      ) : null}
      {route.missingNames.length > 0 ? (
        <p
          role="status"
          className="mt-2 text-xs text-muted-foreground"
          data-testid="day-route-missing"
        >
          {DAY_ROUTE_MISSING_TEXT}
        </p>
      ) : null}
    </div>
  );
}
