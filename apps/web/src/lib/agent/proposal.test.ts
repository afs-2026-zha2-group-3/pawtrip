import { describe, expect, it } from "vitest";
import type { TripPlan } from "@/lib/trip/types";
import { diffPlans, validatePlanEdits } from "./proposal";

const tripId = 12;
const allowed = new Set(["a", "b", "c"]);

function edit(operations: unknown[], targetTripId = tripId) {
  return {
    targetTripId,
    operations,
    summary: "调整第一天",
    warnings: ["注意营业时间"],
  };
}

const current: TripPlan = {
  version: 1,
  days: [
    { day: 1, stops: [{ poiId: "existing" }, { poiId: "a" }] },
    { day: 2, stops: [] },
  ],
  unscheduled: [{ poiId: "c" }],
};

function validate(operations: unknown[], targetTripId = tripId) {
  return validatePlanEdits(edit(operations, targetTripId), current, {
    tripId,
    totalDays: 2,
    allowedPoiIds: allowed,
  });
}

describe("validatePlanEdits", () => {
  it("adds a stop without dropping the existing itinerary", () => {
    const result = validate([{ op: "add_stop", poiId: "b", day: 1, position: 1 }]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.days[0].stops).toEqual([
      { poiId: "existing" },
      { poiId: "b" },
      { poiId: "a" },
    ]);
    expect(result.plan.days[1].stops).toEqual([]);
    expect(result.warnings).toEqual(["注意营业时间"]);
  });

  it("creates the target day when the current plan is empty", () => {
    const empty: TripPlan = { version: 1, days: [], unscheduled: [] };
    const result = validatePlanEdits(
      edit([
        { op: "add_stop", poiId: "a", day: 1 },
        { op: "add_stop", poiId: "b", day: 1, position: 1 },
      ]),
      empty,
      { tripId, totalDays: 2, allowedPoiIds: allowed },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.days).toEqual([
      { day: 1, stops: [{ poiId: "a" }, { poiId: "b" }] },
      { day: 2, stops: [] },
    ]);
  });

  it("moves a stop out of unscheduled when it is scheduled", () => {
    const result = validate([{ op: "add_stop", poiId: "c", day: 2, toNext: "walk" }]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.days[1].stops).toEqual([{ poiId: "c", toNext: "walk" }]);
    expect(result.plan.unscheduled).toEqual([]);
  });

  it("reorders an existing stop by removing and re-adding it", () => {
    const result = validate([
      { op: "remove_stop", poiId: "existing", day: 1 },
      { op: "add_stop", poiId: "existing", day: 1, position: 0 },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.days[0].stops).toEqual([{ poiId: "existing" }, { poiId: "a" }]);
  });

  it("removes an existing stop without requiring it in the current location results", () => {
    const result = validate([{ op: "remove_stop", poiId: "existing" }]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.days[0].stops).toEqual([{ poiId: "a" }]);
  });

  it("adds and removes unscheduled locations", () => {
    const added = validate([{ op: "add_unscheduled", poiId: "b" }]);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.plan.unscheduled).toEqual([{ poiId: "c" }, { poiId: "b" }]);

    const removed = validate([{ op: "remove_unscheduled", poiId: "c" }]);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.plan.unscheduled).toEqual([]);
  });

  it("rejects a mismatched, empty or unknown-poi edit", () => {
    const wrongTarget = validate([{ op: "add_stop", poiId: "b", day: 1 }], 99);
    expect(wrongTarget.ok).toBe(false);

    const empty = validate([]);
    expect(empty.ok).toBe(false);

    const unknown = validate([{ op: "add_stop", poiId: "zzz", day: 1 }]);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error).toContain("未查询到");
    }
  });

  it("rejects invalid days, positions and transport modes", () => {
    expect(validate([{ op: "add_stop", poiId: "b", day: 3 }]).ok).toBe(false);
    expect(validate([{ op: "add_stop", poiId: "b", day: 1, position: 9 }]).ok).toBe(false);
    expect(validate([{ op: "add_stop", poiId: "b", day: 1, toNext: "fly" }]).ok).toBe(false);
    expect(validate([{ op: "remove_stop", poiId: "missing" }]).ok).toBe(false);
    expect(validate([{ op: "add_unscheduled", poiId: "a" }]).ok).toBe(false);
  });
});

describe("diffPlans", () => {
  it("reports added, removed and unscheduled differences", () => {
    const before: TripPlan = {
      version: 1,
      days: [{ day: 1, stops: [{ poiId: "a" }] }],
      unscheduled: [{ poiId: "c" }],
    };
    const next: TripPlan = {
      version: 1,
      days: [{ day: 1, stops: [{ poiId: "b" }] }],
      unscheduled: [{ poiId: "a" }],
    };

    const diff = diffPlans(before, next, 2);
    expect(diff.days[0]).toEqual({ day: 1, added: ["b"], removed: ["a"], kept: [] });
    expect(diff.days[1]).toEqual({ day: 2, added: [], removed: [], kept: [] });
    expect(diff.unscheduledAdded).toEqual(["a"]);
    expect(diff.unscheduledRemoved).toEqual(["c"]);
  });
});
