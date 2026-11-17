import type { TransportMode } from "@/data/transport-rules";
import { displayToNext, type DisplayToNextMode } from "./plan";
import type { TripStop } from "./types";

export const TAXI_PET_HINT = "部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带";
export const TRANSIT_PET_NOTICE = "地铁/公交：不可携带宠物上车";
export const SAME_POI_NOTE = "与上一景点相同，无需途内交通";
export const ESTIMATE_UNAVAILABLE_TEXT = "估算暂不可用";
export const ESTIMATE_LOADING_TEXT = "估算中…";

export const toNextLabels: Record<DisplayToNextMode, string> = {
  drive: "打车",
  walk: "步行",
  self_drive: "驾车",
};

export interface TransportSegment {
  fromIndex: number;
  fromPoiId: string;
  toPoiId: string;
  samePoi: boolean;
  displayMode: DisplayToNextMode;
  showTaxiHint: boolean;
}

export function buildDaySegments(
  stops: TripStop[],
  transportMode: TransportMode | null,
): TransportSegment[] {
  const segments: TransportSegment[] = [];
  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];
    const samePoi = from.poiId === to.poiId;
    const displayMode = displayToNext(from, transportMode);
    segments.push({
      fromIndex: index,
      fromPoiId: from.poiId,
      toPoiId: to.poiId,
      samePoi,
      displayMode,
      showTaxiHint: !samePoi && displayMode === "drive",
    });
  }
  return segments;
}

export function showTransitNotice(
  stops: TripStop[],
  transportMode: TransportMode | null,
): boolean {
  return stops.length >= 2 && transportMode !== "drive";
}

export function transportSelectorOptions(
  transportMode: TransportMode | null,
): DisplayToNextMode[] {
  return transportMode === "drive" ? ["drive", "walk", "self_drive"] : ["drive", "walk"];
}