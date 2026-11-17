import type { LocationBrowseDetail, PetPolicies } from "@/queries/locations";
import type { Pet } from "@/queries/pets";
import { dayPolicyLines, deriveDayPolicy } from "./day-policy";
import { displayToNext } from "./plan";
import { toNextLabels } from "./transport-segments";
import type { ToNextEstimate, Trip } from "./types";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export type ItineraryPet = Pick<
  Pet,
  "hasLeash" | "weightKg" | "shoulderHeightCm"
> | null;

export function addDays(isoDate: string, offsetDays: number): string | null {
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

export function formatTripDate(isoDate: string): string | null {
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  const date = new Date(ms);
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${
    WEEKDAYS[date.getUTCDay()]
  }`;
}

export type ItineraryEntry =
  | {
      kind: "stop";
      key: string;
      name: string;
      address: string | null;
      policy: PetPolicies | null;
    }
  | {
      kind: "transport";
      key: string;
      label: string;
      estimate: ToNextEstimate | null;
      fromPoiId: string;
      toPoiId: string;
      displayMode: "walk" | "drive" | "self_drive";
    };

export interface ItineraryDayLine {
  day: number;
  dateLabel: string | null;
  city: string;
  entries: ItineraryEntry[];
  policyLines: string[];
}

export interface Itinerary {
  days: ItineraryDayLine[];
  unscheduledNames: string[];
}

export function buildItinerary(
  trip: Trip,
  cityName: string,
  locations: Record<string, LocationBrowseDetail>,
  pet: ItineraryPet,
): Itinerary {
  const days = Array.from({ length: trip.totalDays }, (_, index) => {
    const day = index + 1;
    const stops =
      trip.plan.days.find((entry) => entry.day === day)?.stops ?? [];
    const date = trip.startDate ? addDays(trip.startDate, index) : null;
    const entries: ItineraryEntry[] = [];
    stops.forEach((stop, stopIndex) => {
      const detail = locations[stop.poiId];
      entries.push({
        kind: "stop",
        key: `day-${day}-stop-${stopIndex}`,
        name: detail?.name ?? stop.poiId,
        address: detail?.address ?? null,
        policy: detail?.petPolicies ?? null,
      });
      if (stopIndex < stops.length - 1) {
        const displayMode = displayToNext(stop, trip.transportMode);
        entries.push({
          kind: "transport",
          key: `day-${day}-transport-${stopIndex}`,
          label: toNextLabels[displayMode],
          estimate: stop.toNextEstimate ?? null,
          fromPoiId: stop.poiId,
          toPoiId: stops[stopIndex + 1].poiId,
          displayMode,
        });
      }
    });
    return {
      day,
      dateLabel: date ? formatTripDate(date) : null,
      city: cityName,
      entries,
      policyLines: dayPolicyLines(deriveDayPolicy(stops, locations, pet)),
    } satisfies ItineraryDayLine;
  });

  return {
    days,
    unscheduledNames: trip.plan.unscheduled.map(
      (stop) => locations[stop.poiId]?.name ?? stop.poiId,
    ),
  };
}
