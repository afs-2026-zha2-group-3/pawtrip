import type { TransportMode } from "@/data/transport-rules";

export type { TransportMode };
import type { LocationBrowseDetail } from "@/queries/locations";
import type { Pet } from "@/queries/pets";

export const MIN_TRIP_DAYS = 1;
export const MAX_TRIP_DAYS = 7;

export interface TripStop {
  poiId: string;
  toNext?: string | null;
}

export interface TripDay {
  day: number;
  stops: TripStop[];
}

export interface UnscheduledStop {
  poiId: string;
}

export interface TripPlan {
  version: 1;
  days: TripDay[];
  unscheduled: UnscheduledStop[];
}

export interface Trip {
  id: number;
  name: string;
  cityAdcode: string;
  petId: number;
  totalDays: number;
  transportMode: TransportMode | null;
  plan: TripPlan;
  createdAt: string;
  updatedAt: string;
}

export interface DraftTrip {
  cityAdcode: string;
  totalDays: number | null;
  petId: number | null;
}

export interface TripCity {
  adcode: string;
  name: string;
  province: string;
}

export interface TripCache {
  city: TripCity | null;
  pets: Record<number, Pet>;
  locations: Record<string, LocationBrowseDetail>;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface TripSaveState {
  status: SaveStatus;
  lastSavedAt?: string;
  message?: string;
}

export type HydrationStatus = "idle" | "loading" | "ready" | "missing";

export interface TripState {
  draft: DraftTrip | null;
  active: Trip | null;
  cache: TripCache;
  panel: { expanded: boolean };
  save: TripSaveState;
  hydration: HydrationStatus;
  saveRevision: number;
}

export interface SaveTripInput {
  name: string;
  cityAdcode?: string;
  petId?: number;
  totalDays: number;
  transportMode: TransportMode | null;
  plan: TripPlan;
}
