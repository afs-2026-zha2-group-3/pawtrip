export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const ACTIVE_TRIP_ID_KEY = "pawtrip.activeTripId";
export const LEGACY_KEYS = ["pawtrip.selectedDestination", "pawtrip.tripDuration"] as const;

export function readActiveTripId(storage: StorageLike): number | null {
  try {
    const raw = storage.getItem(ACTIVE_TRIP_ID_KEY);
    if (raw == null || !/^\d+$/.test(raw.trim())) {
      return null;
    }
    const id = Number(raw);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function writeActiveTripId(storage: StorageLike, tripId: number): void {
  try {
    storage.setItem(ACTIVE_TRIP_ID_KEY, String(tripId));
  } catch {
    // Storage may be unavailable; the in-memory store remains authoritative.
  }
}

export function clearActiveTripId(storage: StorageLike): void {
  try {
    storage.removeItem(ACTIVE_TRIP_ID_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function cleanupLegacyKeys(storage: StorageLike): void {
  for (const key of LEGACY_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore unavailable storage.
    }
  }
}

function browserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function persistActiveTripId(tripId: number): void {
  const storage = browserStorage();
  if (storage) writeActiveTripId(storage, tripId);
}

export function removePersistedActiveTripId(): void {
  const storage = browserStorage();
  if (storage) clearActiveTripId(storage);
}

export function removeLegacyKeys(): void {
  if (typeof window === "undefined") return;
  cleanupLegacyKeys(window.sessionStorage);
}

export function readPersistedActiveTripId(): number | null {
  const storage = browserStorage();
  return storage ? readActiveTripId(storage) : null;
}
