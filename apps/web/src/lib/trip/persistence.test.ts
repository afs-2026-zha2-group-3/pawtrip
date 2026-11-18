import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-error";
import { resolveHydration } from "./hydrate";
import {
  ACTIVE_TRIP_ID_KEY,
  LEGACY_KEYS,
  cleanupLegacyKeys,
  clearActiveTripId,
  readActiveTripId,
  writeActiveTripId,
  type StorageLike,
} from "./persistence";
import type { Trip } from "./types";

function storage(initial: Record<string, string> = {}): StorageLike & {
  values: Record<string, string>;
} {
  const values = { ...initial };
  return {
    values,
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value;
    },
    removeItem: (key) => {
      delete values[key];
    },
  };
}

const trip: Trip = {
  id: 12,
  name: "杭州 · 2天 · 旺财",
  cityAdcode: "330100",
  petId: 1,
  totalDays: 2,
  startDate: null,
  transportMode: null,
  planCompleted: false,
  plan: { version: 1, days: [], unscheduled: [] },
  createdAt: "2026-11-16T00:00:00Z",
  updatedAt: "2026-11-16T00:00:00Z",
};

describe("active trip persistence", () => {
  it("reads, writes and clears only the active trip id", () => {
    const store = storage();
    expect(readActiveTripId(store)).toBeNull();
    writeActiveTripId(store, 12);
    expect(store.values[ACTIVE_TRIP_ID_KEY]).toBe("12");
    expect(readActiveTripId(store)).toBe(12);
    clearActiveTripId(store);
    expect(readActiveTripId(store)).toBeNull();
  });

  it("rejects malformed ids", () => {
    expect(readActiveTripId(storage({ [ACTIVE_TRIP_ID_KEY]: "abc" }))).toBeNull();
    expect(readActiveTripId(storage({ [ACTIVE_TRIP_ID_KEY]: "0" }))).toBeNull();
    expect(readActiveTripId(storage({ [ACTIVE_TRIP_ID_KEY]: "1.5" }))).toBeNull();
  });

  it("cleans legacy session keys and leaves other keys untouched", () => {
    const store = storage({
      [LEGACY_KEYS[0]]: "{}",
      [LEGACY_KEYS[1]]: "3",
      "pawtrip:selected-transport-mode": "train",
    });
    cleanupLegacyKeys(store);
    expect(store.values[LEGACY_KEYS[0]]).toBeUndefined();
    expect(store.values[LEGACY_KEYS[1]]).toBeUndefined();
    expect(store.values["pawtrip:selected-transport-mode"]).toBe("train");
  });
});

describe("trip hydration outcomes", () => {
  it("writes the trip on success", async () => {
    await expect(resolveHydration(() => Promise.resolve(trip))).resolves.toEqual({
      kind: "ready",
      trip,
    });
  });

  it("clears on 404 or 401", async () => {
    for (const status of [404, 401]) {
      await expect(
        resolveHydration(() =>
          Promise.reject(new ApiError({ status, code: "X" })),
        ),
      ).resolves.toEqual({ kind: "missing" });
    }
  });

  it("keeps the id and allows retry on network or 5xx failures", async () => {
    for (const error of [
      new ApiError({ status: 500 }),
      ApiError.network(),
      new Error("boom"),
    ]) {
      await expect(
        resolveHydration(() => Promise.reject(error)),
      ).resolves.toEqual({ kind: "retry" });
    }
  });
});
