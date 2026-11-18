import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/api-error";
import type { Trip, TripPlan } from "@/lib/trip/types";
import { applyProposal, type ApplyProposalDeps } from "./apply";
import type { AgentProposal } from "./types";

const plan: TripPlan = {
  version: 1,
  days: [{ day: 1, stops: [{ poiId: "a" }] }],
  unscheduled: [],
};

const proposal: AgentProposal = {
  id: "call-1",
  tripId: 7,
  plan,
  summary: "调整",
  warnings: [],
  baseUpdatedAt: "2026-01-01T00:00:00Z",
  status: "pending",
  createdAt: "2026-01-01T00:00:00Z",
};

function trip(overrides: Partial<Omit<Trip, "startDate">> = {}): Trip {
  return {
    id: 7,
    name: "珠海两日",
    cityAdcode: "440400",
    petId: 3,
    totalDays: 1,
    startDate: null,
    transportMode: "drive",
    planCompleted: false,
    plan: { version: 1, days: [{ day: 1, stops: [] }], unscheduled: [] },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function deps(overrides: Partial<ApplyProposalDeps> = {}): ApplyProposalDeps {
  return {
    activeTripId: 7,
    fetchTrip: vi.fn(async () => trip()),
    flushSave: vi.fn(async () => ({ ok: true })),
    replaceActivePlan: vi.fn(),
    verifyPoiId: vi.fn(async () => true),
    refresh: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("applyProposal", () => {
  it("applies to the active trip by flushing pending saves and bumping the plan", async () => {
    const flushSave = vi.fn(async () => ({ ok: true }));
    const replaceActivePlan = vi.fn();
    const refresh = vi.fn(async () => undefined);

    const result = await applyProposal(proposal, deps({ flushSave, replaceActivePlan, refresh }));

    expect(result).toEqual({ ok: true });
    expect(flushSave).toHaveBeenCalledTimes(2);
    expect(replaceActivePlan).toHaveBeenCalledWith(plan);
    expect(refresh).toHaveBeenCalled();
  });

  it("refuses to apply when the target is no longer the active trip", async () => {
    const fetchTrip = vi.fn(async () => trip());
    const result = await applyProposal(proposal, deps({ activeTripId: 9, fetchTrip }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not_active");
    }
    expect(fetchTrip).not.toHaveBeenCalled();
  });

  it("aborts when pending local save fails", async () => {
    const replaceActivePlan = vi.fn();
    const result = await applyProposal(
      proposal,
      deps({
        flushSave: vi.fn(async () => ({ ok: false as const, status: 500 })),
        replaceActivePlan,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("save_failed");
    }
    expect(replaceActivePlan).not.toHaveBeenCalled();
  });

  it("aborts when the target changed after preview", async () => {
    const flushSave = vi.fn(async () => ({ ok: true }));
    const result = await applyProposal(
      proposal,
      deps({
        fetchTrip: vi.fn(async () => trip({ updatedAt: "2026-02-02T00:00:00Z" })),
        flushSave,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("stale");
    }
    expect(flushSave).not.toHaveBeenCalled();
  });

  it("keeps the proposal when the save returns 400", async () => {
    const result = await applyProposal(
      proposal,
      deps({
        flushSave: vi
          .fn()
          .mockResolvedValueOnce({ ok: true })
          .mockResolvedValueOnce({ ok: false, status: 400 }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("validation");
    }
  });

  it("terminates when the target trip is gone", async () => {
    const result = await applyProposal(
      proposal,
      deps({
        fetchTrip: vi.fn(async () => {
          throw new ApiError({ status: 404 });
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not_found");
    }
  });

  it("terminates when a proposed location disappeared", async () => {
    const replaceActivePlan = vi.fn();
    const result = await applyProposal(
      proposal,
      deps({
        verifyPoiId: vi.fn(async () => false),
        replaceActivePlan,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_location");
    }
    expect(replaceActivePlan).not.toHaveBeenCalled();
  });
});
