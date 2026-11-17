import type { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/http/api-error";
import { destinationsQueryOptions } from "@/queries/destinations";
import { petsQueryOptions } from "@/queries/pets";
import { fetchTripDetail } from "@/queries/trips";
import {
  readPersistedActiveTripId,
  removeLegacyKeys,
  removePersistedActiveTripId,
} from "./persistence";
import { tripActions } from "./store";
import type { Trip } from "./types";

export type HydrationOutcome =
  | { kind: "ready"; trip: Trip }
  | { kind: "missing" }
  | { kind: "retry" };

export async function resolveHydration(
  getTrip: () => Promise<Trip>,
): Promise<HydrationOutcome> {
  try {
    return { kind: "ready", trip: await getTrip() };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) {
      return { kind: "missing" };
    }
    return { kind: "retry" };
  }
}

let inFlight: Promise<void> | null = null;

export function hydrateTripContext(queryClient: QueryClient): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = doHydrate(queryClient).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function retryTripHydration(queryClient: QueryClient): Promise<void> {
  inFlight = null;
  return hydrateTripContext(queryClient);
}

async function doHydrate(queryClient: QueryClient): Promise<void> {
  removeLegacyKeys();
  const tripId = readPersistedActiveTripId();
  if (tripId == null) {
    tripActions.setHydration("ready");
    return;
  }
  tripActions.setHydration("loading");
  const outcome = await resolveHydration(() => fetchTripDetail(tripId));
  if (outcome.kind === "missing") {
    removePersistedActiveTripId();
    tripActions.clearActive();
    tripActions.setHydration("missing");
    return;
  }
  if (outcome.kind === "retry") {
    tripActions.setHydration("idle");
    return;
  }
  tripActions.setActive(outcome.trip);
  tripActions.setHydration("ready");
  await Promise.allSettled([
    cacheCity(queryClient, outcome.trip.cityAdcode),
    cachePets(queryClient),
  ]);
}

async function cacheCity(queryClient: QueryClient, adcode: string): Promise<void> {
  const destinations = await queryClient.fetchQuery(destinationsQueryOptions({}));
  const city = destinations.find((candidate) => candidate.adcode === adcode);
  if (city) {
    tripActions.cacheCity({
      adcode: city.adcode,
      name: city.name,
      province: city.province,
    });
  }
}

async function cachePets(queryClient: QueryClient): Promise<void> {
  const pets = await queryClient.fetchQuery(petsQueryOptions());
  tripActions.cachePets(pets);
}
