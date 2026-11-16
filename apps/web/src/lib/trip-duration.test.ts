import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TRIP_DURATION_KEY,
  createTripDurationStore,
  isValidTripDuration,
  parseTripDuration,
  type StorageLike,
} from "./trip-duration";

function fakeStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe("trip duration validation", () => {
  it("accepts only integers from 1 through 7", () => {
    expect(isValidTripDuration(1)).toBe(true);
    expect(isValidTripDuration(7)).toBe(true);
    expect(isValidTripDuration(0)).toBe(false);
    expect(isValidTripDuration(8)).toBe(false);
    expect(isValidTripDuration(1.5)).toBe(false);
    expect(isValidTripDuration("3")).toBe(false);
    expect(isValidTripDuration(null)).toBe(false);
  });

  it("parses only valid persisted integer strings", () => {
    expect(parseTripDuration("3")).toBe(3);
    expect(parseTripDuration("01")).toBe(1);
    expect(parseTripDuration("0")).toBeNull();
    expect(parseTripDuration("8")).toBeNull();
    expect(parseTripDuration("1.5")).toBeNull();
    expect(parseTripDuration("hello")).toBeNull();
    expect(parseTripDuration(null)).toBeNull();
  });
});

describe("trip duration store", () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it("persists a legal value and overwrites the previous value", () => {
    const store = createTripDurationStore(storage);

    expect(store.set(3)).toBe(true);
    expect(storage.map.get(TRIP_DURATION_KEY)).toBe("3");
    expect(store.set(5)).toBe(true);
    expect(store.get()).toBe(5);
    expect(storage.map.get(TRIP_DURATION_KEY)).toBe("5");
  });

  it("does not overwrite a legal value with an illegal value", () => {
    const store = createTripDurationStore(storage);
    store.set(3);

    expect(store.set(0)).toBe(false);
    expect(store.set(8)).toBe(false);
    expect(store.set(1.5)).toBe(false);
    expect(store.get()).toBe(3);
    expect(storage.map.get(TRIP_DURATION_KEY)).toBe("3");
  });

  it("treats missing or corrupted storage as not filled", () => {
    storage.map.set(TRIP_DURATION_KEY, "1.5");
    expect(createTripDurationStore(storage).get()).toBeNull();

    storage.map.set(TRIP_DURATION_KEY, "7");
    expect(createTripDurationStore(storage).get()).toBe(7);
  });

  it("notifies subscribers after successful changes and clear", () => {
    const store = createTripDurationStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set(3);
    expect(listener).toHaveBeenCalledTimes(1);
    store.set(8);
    expect(listener).toHaveBeenCalledTimes(1);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.set(5);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
