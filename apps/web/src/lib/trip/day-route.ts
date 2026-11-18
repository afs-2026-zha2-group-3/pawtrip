import type { LocationBrowseDetail } from "@/queries/locations";
import type { ItineraryDayLine } from "./itinerary";

export type DayRouteMode = "drive" | "walk";

export interface DayRouteStop {
  number: number;
  poiId: string;
  name: string;
  longitude: number | null;
  latitude: number | null;
}

export interface DayRouteSegment {
  key: string;
  fromNumber: number;
  toNumber: number;
  fromPoiId: string;
  toPoiId: string;
  mode: DayRouteMode;
  samePoi: boolean;
  drawable: boolean;
  missingNames: string[];
  estimateMinutes: number | null;
}

export interface DayRoute {
  stops: DayRouteStop[];
  segments: DayRouteSegment[];
  missingNames: string[];
}

export const DAY_ROUTE_EMPTY_TEXT = "当天暂无地点";
export const DAY_ROUTE_SINGLE_TEXT = "当天只有一个地点，无需路线";
export const DAY_ROUTE_ALL_MISSING_TEXT = "地点缺少坐标，无法绘制路线";
export const DAY_ROUTE_MISSING_TEXT = "部分地点缺少坐标，涉及路段未绘制";
export const DAY_ROUTE_PARTIAL_FAILED_TEXT = "部分路段路线获取失败";
export const DAY_ROUTE_FAILED_TEXT = "路线获取失败";
export const DAY_ROUTE_LOADING_TEXT = "路线规划中…";
export const DAY_ROUTE_MISSING_KEY_TEXT = "地图未配置，无法绘制路线";

function hasCoordinates(stop: DayRouteStop): boolean {
  return stop.longitude != null && stop.latitude != null;
}

function uniqueNames(names: string[]): string[] {
  return [...new Set(names)];
}

export function buildDayRoute(
  day: ItineraryDayLine,
  locations: Record<string, LocationBrowseDetail>,
): DayRoute {
  const stops: DayRouteStop[] = [];
  const segments: DayRouteSegment[] = [];
  let pendingMode: DayRouteMode | null = null;
  let pendingEstimate: number | null = null;

  for (const entry of day.entries) {
    if (entry.kind === "transport") {
      pendingMode = entry.displayMode === "walk" ? "walk" : "drive";
      pendingEstimate = entry.estimate?.durationMinutes ?? null;
      continue;
    }
    const detail = locations[entry.poiId];
    const stop: DayRouteStop = {
      number: stops.length + 1,
      poiId: entry.poiId,
      name: entry.name,
      longitude: detail?.longitude ?? null,
      latitude: detail?.latitude ?? null,
    };
    const previous = stops[stops.length - 1];
    stops.push(stop);
    if (!previous) {
      continue;
    }
    const samePoi = previous.poiId === stop.poiId;
    const missingNames = uniqueNames(
      [previous, stop]
        .filter((candidate) => !hasCoordinates(candidate))
        .map((candidate) => candidate.name),
    );
    segments.push({
      key: `${day.day}-segment-${stops.length - 1}`,
      fromNumber: previous.number,
      toNumber: stop.number,
      fromPoiId: previous.poiId,
      toPoiId: stop.poiId,
      mode: pendingMode ?? "drive",
      samePoi,
      drawable: !samePoi && missingNames.length === 0,
      missingNames,
      estimateMinutes: pendingEstimate,
    });
    pendingMode = null;
    pendingEstimate = null;
  }

  return {
    stops,
    segments,
    missingNames: uniqueNames(
      stops
        .filter((stop) => !hasCoordinates(stop))
        .map((stop) => stop.name),
    ),
  };
}

export function formatRouteDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} 米`;
  }
  return `${(meters / 1000).toFixed(1)} 公里`;
}

export function routeMinutesFromSeconds(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}

export function formatRouteDuration(minutes: number): string {
  return `${minutes} 分钟`;
}

export function formatRouteLabel(distanceMeters: number, minutes: number): string {
  return `${formatRouteDistance(distanceMeters)} · ${formatRouteDuration(minutes)}`;
}
