import { useSyncExternalStore } from "react";

export const TRIP_DURATION_KEY = "pawtrip.tripDuration";
export const MIN_TRIP_DURATION = 1;
export const MAX_TRIP_DURATION = 7;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface TripDurationStore {
  get(): number | null;
  set(value: unknown): boolean;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export function isValidTripDuration(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_TRIP_DURATION &&
    value <= MAX_TRIP_DURATION
  );
}

export function parseTripDuration(value: string | null): number | null {
  if (value == null || !/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);
  return isValidTripDuration(parsed) ? parsed : null;
}

export function createTripDurationStore(storage: StorageLike): TripDurationStore {
  const listeners = new Set<() => void>();
  let snapshot = readTripDuration(storage);

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    get: () => snapshot,
    set(value) {
      if (!isValidTripDuration(value)) {
        return false;
      }

      try {
        storage.setItem(TRIP_DURATION_KEY, String(value));
      } catch {
        return false;
      }

      snapshot = value;
      notify();
      return true;
    },
    clear() {
      try {
        storage.removeItem(TRIP_DURATION_KEY);
      } catch {
        // Browser storage may be unavailable; clearing the in-memory snapshot is safe.
      }
      snapshot = null;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function readTripDuration(storage: StorageLike): number | null {
  try {
    return parseTripDuration(storage.getItem(TRIP_DURATION_KEY));
  } catch {
    return null;
  }
}

const browserStorage: StorageLike | null =
  typeof window === "undefined" ? null : window.sessionStorage;

const noopStore: TripDurationStore = {
  get: () => null,
  set: () => false,
  clear: () => {},
  subscribe: () => () => {},
};

export const tripDurationStore: TripDurationStore = browserStorage
  ? createTripDurationStore(browserStorage)
  : noopStore;

export function useTripDuration(): number | null {
  return useSyncExternalStore(
    tripDurationStore.subscribe,
    tripDurationStore.get,
    () => null,
  );
}
