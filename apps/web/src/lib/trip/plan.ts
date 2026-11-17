import type { TripPlan } from "./types";

export type StopContainer = number | "unscheduled";

export interface StopRef {
  container: StopContainer;
  index: number;
}

export function createEmptyPlan(totalDays: number): TripPlan {
  const days = Array.from({ length: Math.max(1, totalDays) }, (_, index) => ({
    day: index + 1,
    stops: [],
  }));
  return { version: 1, days, unscheduled: [] };
}

export function normalizePlan(plan: TripPlan, totalDays: number): TripPlan {
  const scheduledPoiIds = new Set<string>();
  const dayMap = new Map<number, TripPlan["days"][number]>();
  for (const day of plan.days) {
    if (day.day < 1 || day.day > totalDays) {
      continue;
    }
    const existing = dayMap.get(day.day);
    const stops = [...(existing?.stops ?? []), ...day.stops];
    for (const stop of stops) {
      scheduledPoiIds.add(stop.poiId);
    }
    dayMap.set(day.day, { day: day.day, stops });
  }
  const days = Array.from({ length: Math.max(1, totalDays) }, (_, index) => {
    const day = index + 1;
    return dayMap.get(day) ?? { day, stops: [] };
  });
  const seen = new Set<string>();
  const unscheduled = plan.unscheduled.filter((stop) => {
    if (scheduledPoiIds.has(stop.poiId) || seen.has(stop.poiId)) {
      return false;
    }
    seen.add(stop.poiId);
    return true;
  });
  return { version: 1, days, unscheduled };
}

export function stoppablePoiIds(plan: TripPlan): Set<string> {
  const ids = new Set<string>();
  for (const day of plan.days) {
    for (const stop of day.stops) {
      ids.add(stop.poiId);
    }
  }
  return ids;
}

export function stopKey(container: StopContainer, index: number, poiId: string): string {
  return `${container === "unscheduled" ? "u" : `d${container}`}:${index}:${poiId}`;
}
