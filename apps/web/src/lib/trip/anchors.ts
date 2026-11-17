import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { locationBrowseDetailQueryOptions, type LocationBrowseDetail } from "@/queries/locations";
import type { Trip } from "./types";

export interface ScheduledAttractionAnchor {
  poiId: string;
  name: string;
}

export function scheduledPoiIds(active: Trip | null): string[] {
  if (!active) {
    return [];
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const day of active.plan.days) {
    for (const stop of day.stops) {
      if (seen.has(stop.poiId)) {
        continue;
      }
      seen.add(stop.poiId);
      ids.push(stop.poiId);
    }
  }
  return ids;
}

export function attractionAnchors(
  poiIds: string[],
  locations: Record<string, LocationBrowseDetail | undefined>,
): ScheduledAttractionAnchor[] {
  const anchors: ScheduledAttractionAnchor[] = [];
  for (const poiId of poiIds) {
    const location = locations[poiId];
    if (location?.typeGroup === "attraction") {
      anchors.push({ poiId: location.poiId, name: location.name });
    }
  }
  return anchors;
}

export function useScheduledAttractionAnchors(active: Trip | null): {
  anchors: ScheduledAttractionAnchor[];
  loading: boolean;
} {
  const poiIds = useMemo(() => scheduledPoiIds(active), [active]);
  const details = useQueries({
    queries: poiIds.map((poiId) => locationBrowseDetailQueryOptions(poiId)),
  });
  const anchors = attractionAnchors(
    poiIds,
    Object.fromEntries(
      details
        .map((detail) => detail.data)
        .filter((detail): detail is LocationBrowseDetail => detail !== undefined)
        .map((detail) => [detail.poiId, detail]),
    ),
  );
  return {
    anchors,
    loading: details.some((detail) => detail.isPending),
  };
}
