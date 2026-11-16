import { useSyncExternalStore } from "react";

export const SELECTED_DESTINATION_KEY = "pawtrip.selectedDestination";

export interface SelectedDestination {
  adcode: string;
  cityName: string;
  province: string;
  selectedAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SelectedDestinationStore {
  get(): SelectedDestination | null;
  select(input: { adcode: string; cityName: string; province: string }): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export function createSelectedDestinationStore(storage: StorageLike): SelectedDestinationStore {
  const listeners = new Set<() => void>();
  let snapshot: SelectedDestination | null = read(storage);

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    get: () => snapshot,
    select(input) {
      const next: SelectedDestination = { ...input, selectedAt: new Date().toISOString() };
      storage.setItem(SELECTED_DESTINATION_KEY, JSON.stringify(next));
      snapshot = next;
      notify();
    },
    clear() {
      storage.removeItem(SELECTED_DESTINATION_KEY);
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

function read(storage: StorageLike): SelectedDestination | null {
  const raw = storage.getItem(SELECTED_DESTINATION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SelectedDestination>;
    if (
      typeof parsed.adcode === "string" &&
      typeof parsed.cityName === "string" &&
      typeof parsed.province === "string" &&
      typeof parsed.selectedAt === "string"
    ) {
      return parsed as SelectedDestination;
    }
    return null;
  } catch {
    return null;
  }
}

const browserStorage: StorageLike | null =
  typeof window === "undefined" ? null : window.sessionStorage;

const noopStore: SelectedDestinationStore = {
  get: () => null,
  select: () => {},
  clear: () => {},
  subscribe: () => () => {},
};

export const selectedDestinationStore: SelectedDestinationStore = browserStorage
  ? createSelectedDestinationStore(browserStorage)
  : noopStore;

export function useSelectedDestination(): SelectedDestination | null {
  return useSyncExternalStore(
    selectedDestinationStore.subscribe,
    selectedDestinationStore.get,
    () => null,
  );
}