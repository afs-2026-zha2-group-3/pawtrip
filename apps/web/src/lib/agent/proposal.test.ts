import { describe, expect, it } from "vitest";
import type { TripPlan } from "@/lib/trip/types";
import { diffPlans, validateProposal } from "./proposal";

const tripId = 12;
const allowed = new Set(["a", "b", "c"]);

function input(plan: unknown, targetTripId = tripId) {
  return {
    target: { kind: "existing", tripId: targetTripId },
    plan,
    summary: "调整第一天",
    warnings: ["注意营业时间"],
  };
}

describe("validateProposal", () => {
  it("accepts a valid plan and normalizes unscheduled duplicates", () => {
    const result = validateProposal(
      input({
        version: 1,
        days: [{ day: 1, stops: [{ poiId: "a", toNext: "walk" }, { poiId: "b" }] }],
        unscheduled: [{ poiId: "c" }, { poiId: "c" }],
      }),
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.days[0].stops).toEqual([
      { poiId: "a", toNext: "walk" },
      { poiId: "b" },
    ]);
    expect(result.plan.unscheduled).toEqual([{ poiId: "c" }]);
    expect(result.warnings).toEqual(["注意营业时间"]);
  });

  it("rejects a mismatched target or unknown poiId", () => {
    const wrongTarget = validateProposal(
      input({ version: 1, days: [], unscheduled: [] }, 99),
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );
    expect(wrongTarget.ok).toBe(false);

    const unknown = validateProposal(
      input({ version: 1, days: [{ day: 1, stops: [{ poiId: "zzz" }] }], unscheduled: [] }),
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error).toContain("未查询到");
    }
  });

  it("rejects duplicate or out-of-range days", () => {
    const duplicate = validateProposal(
      input({
        version: 1,
        days: [
          { day: 1, stops: [] },
          { day: 1, stops: [] },
        ],
        unscheduled: [],
      }),
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );
    expect(duplicate.ok).toBe(false);

    const outOfRange = validateProposal(
      input({ version: 1, days: [{ day: 3, stops: [] }], unscheduled: [] }),
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );
    expect(outOfRange.ok).toBe(false);
  });

  it("rejects unsupported toNext values", () => {
    const result = validateProposal(
      input({
        version: 1,
        days: [{ day: 1, stops: [{ poiId: "a", toNext: "fly" }] }],
        unscheduled: [],
      }),
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );
    expect(result.ok).toBe(false);
  });
});

describe("diffPlans", () => {
  it("reports added, removed and unscheduled differences", () => {
    const current: TripPlan = {
      version: 1,
      days: [{ day: 1, stops: [{ poiId: "a" }] }],
      unscheduled: [{ poiId: "c" }],
    };
    const next: TripPlan = {
      version: 1,
      days: [{ day: 1, stops: [{ poiId: "b" }] }],
      unscheduled: [{ poiId: "a" }],
    };

    const diff = diffPlans(current, next, 2);
    expect(diff.days[0]).toEqual({ day: 1, added: ["b"], removed: ["a"], kept: [] });
    expect(diff.days[1]).toEqual({ day: 2, added: [], removed: [], kept: [] });
    expect(diff.unscheduledAdded).toEqual(["a"]);
    expect(diff.unscheduledRemoved).toEqual(["c"]);
  });
});
