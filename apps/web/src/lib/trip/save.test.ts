import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-error";
import { request } from "@/lib/http/request";
import { updateTrip } from "@/queries/trips";
import { flushTripSave } from "./save";
import { tripActions, tripStore } from "./store";
import type { Trip } from "./types";

vi.mock("@/queries/trips", () => ({ updateTrip: vi.fn() }));
vi.mock("@/lib/http/request", () => ({ request: vi.fn() }));

const trip: Trip = {
  id: 5,
  name: "杭州 · 2天 · 豆豆",
  cityAdcode: "330100",
  petId: 1,
  totalDays: 2,
  startDate: "2026-12-01",
  transportMode: null,
  plan: {
    version: 1,
    days: [
      { day: 1, stops: [] },
      { day: 2, stops: [] },
    ],
    unscheduled: [],
  },
  createdAt: "2026-11-16T00:00:00Z",
  updatedAt: "2026-11-16T00:00:00Z",
};

describe("trip auto save", () => {
  beforeEach(() => {
    tripActions.resetForTests();
    vi.clearAllMocks();
    tripActions.setActive(trip);
    tripActions.addStop(1, "poi-a");
  });

  it("saves the normalized plan and transport mode and marks it saved", async () => {
    tripActions.setTransportMode("drive");
    vi.mocked(updateTrip).mockResolvedValue({
      ...trip,
      transportMode: "drive",
      plan: {
        version: 1,
        days: [{ day: 1, stops: [{ poiId: "poi-a" }] }, { day: 2, stops: [] }],
        unscheduled: [],
      },
    });

    await flushTripSave();

    expect(updateTrip).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        name: trip.name,
        totalDays: 2,
        startDate: "2026-12-01",
        plan: expect.objectContaining({ version: 1 }),
        transportMode: "drive",
      }),
    );
    expect(tripStore.state.save.status).toBe("saved");
  });

  it("keeps local edits and reports a retryable failure on network errors", async () => {
    vi.mocked(updateTrip).mockRejectedValue(ApiError.network());

    await flushTripSave();

    expect(tripStore.state.save.status).toBe("error");
    expect(tripStore.state.save.message).toContain("保存失败");
    expect(tripStore.state.active?.plan.days[0].stops).toEqual([{ poiId: "poi-a" }]);
  });

  it("restores server data after a 400 validation error", async () => {
    tripActions.setTransportMode("flight");
    vi.mocked(updateTrip).mockRejectedValue(new ApiError({ status: 400, code: "VALIDATION_ERROR" }));
    vi.mocked(request).mockResolvedValue({
      ...trip,
      plan: { version: 1, days: [], unscheduled: [] },
    });

    await flushTripSave();

    expect(request).toHaveBeenCalledWith("/api/trips/5");
    expect(tripStore.state.save.status).toBe("error");
    expect(tripStore.state.save.message).toContain("服务端");
    expect(tripStore.state.active?.plan.days).toEqual([]);
  });
});
