import { beforeEach, describe, expect, it } from "vitest";
import { displayToNext } from "./plan";
import { tripActions, tripStore } from "./store";
import type { ToNextEstimate, Trip, TripPlan } from "./types";

const DRIVE_ESTIMATE: ToNextEstimate = {
  durationMinutes: 25,
  costLowYuan: 40,
  costHighYuan: 60,
};

const ZERO_ESTIMATE: ToNextEstimate = {
  durationMinutes: 47,
  costLowYuan: 0,
  costHighYuan: 0,
};

function tripWithPlan(plan: TripPlan, transportMode: Trip["transportMode"] = null): Trip {
  return {
    id: 7,
    name: "杭州 · 3天 · 旺财",
    cityAdcode: "330100",
    petId: 1,
    totalDays: 3,
    startDate: null,
    transportMode,
    plan,
    createdAt: "2026-11-17T00:00:00Z",
    updatedAt: "2026-11-17T00:00:00Z",
  };
}

function twoStopPlan(): TripPlan {
  return {
    version: 1,
    days: [
      { day: 1, stops: [{ poiId: "poi-a" }, { poiId: "poi-b" }] },
      { day: 2, stops: [{ poiId: "poi-c" }] },
    ],
    unscheduled: [{ poiId: "poi-u" }],
  };
}

describe("setStopTransport", () => {
  beforeEach(() => {
    tripActions.resetForTests();
    tripActions.setActive(tripWithPlan(twoStopPlan()));
  });

  it("writes mode and snapshot together and bumps the save revision", () => {
    const revision = tripStore.state.saveRevision;
    tripActions.setStopTransport({ container: 1, index: 0 }, "drive", DRIVE_ESTIMATE);

    expect(tripStore.state.active!.plan.days[0].stops[0]).toEqual({
      poiId: "poi-a",
      toNext: "drive",
      toNextEstimate: DRIVE_ESTIMATE,
    });
    expect(tripStore.state.saveRevision).toBe(revision + 1);
  });

  it("stores mode only when the estimate is unavailable", () => {
    tripActions.setStopTransport({ container: 1, index: 0 }, "walk", null);

    const stop = tripStore.state.active!.plan.days[0].stops[0];
    expect(stop.toNext).toBe("walk");
    expect(stop.toNextEstimate).toBeNull();
  });

  it("accepts self_drive with a zero-cost snapshot", () => {
    tripActions.setStopTransport({ container: 1, index: 0 }, "self_drive", ZERO_ESTIMATE);

    expect(tripStore.state.active!.plan.days[0].stops[0]).toEqual({
      poiId: "poi-a",
      toNext: "self_drive",
      toNextEstimate: ZERO_ESTIMATE,
    });
  });

  it("clears the previous snapshot when switching modes without an estimate", () => {
    tripActions.setStopTransport({ container: 1, index: 0 }, "drive", DRIVE_ESTIMATE);
    tripActions.setStopTransport({ container: 1, index: 0 }, "walk", null);

    const stop = tripStore.state.active!.plan.days[0].stops[0];
    expect(stop.toNext).toBe("walk");
    expect(stop.toNextEstimate).toBeNull();
  });

  it("ignores invalid refs without touching state or revision", () => {
    const before = tripStore.state;
    tripActions.setStopTransport({ container: 1, index: 9 }, "drive", DRIVE_ESTIMATE);
    tripActions.setStopTransport({ container: 9, index: 0 }, "drive", DRIVE_ESTIMATE);
    tripActions.setStopTransport({ container: "unscheduled", index: 0 }, "walk", null);

    expect(tripStore.state.active!.plan).toEqual(before.active!.plan);
    expect(tripStore.state.saveRevision).toBe(before.saveRevision);
  });
});

describe("backfillStopEstimate", () => {
  beforeEach(() => {
    tripActions.resetForTests();
    tripActions.setActive(tripWithPlan(twoStopPlan()));
  });

  it("does nothing when the stop has no saved mode", () => {
    const revision = tripStore.state.saveRevision;
    tripActions.backfillStopEstimate({ container: 1, index: 0 }, DRIVE_ESTIMATE);

    expect(tripStore.state.active!.plan.days[0].stops[0].toNextEstimate ?? null).toBeNull();
    expect(tripStore.state.saveRevision).toBe(revision);
  });

  it("fills an empty snapshot for a saved mode and bumps the revision", () => {
    tripActions.setStopTransport({ container: 1, index: 0 }, "drive", null);
    const revision = tripStore.state.saveRevision;

    tripActions.backfillStopEstimate({ container: 1, index: 0 }, DRIVE_ESTIMATE);

    expect(tripStore.state.active!.plan.days[0].stops[0].toNextEstimate).toEqual(DRIVE_ESTIMATE);
    expect(tripStore.state.saveRevision).toBe(revision + 1);
  });

  it("never overwrites an existing snapshot", () => {
    tripActions.setStopTransport({ container: 1, index: 0 }, "drive", DRIVE_ESTIMATE);
    const revision = tripStore.state.saveRevision;

    tripActions.backfillStopEstimate({ container: 1, index: 0 }, ZERO_ESTIMATE);

    expect(tripStore.state.active!.plan.days[0].stops[0].toNextEstimate).toEqual(DRIVE_ESTIMATE);
    expect(tripStore.state.saveRevision).toBe(revision);
  });

  it("ignores invalid refs", () => {
    const revision = tripStore.state.saveRevision;
    tripActions.backfillStopEstimate({ container: 1, index: 9 }, DRIVE_ESTIMATE);
    tripActions.backfillStopEstimate({ container: "unscheduled", index: 0 }, DRIVE_ESTIMATE);

    expect(tripStore.state.saveRevision).toBe(revision);
  });
});

describe("stop snapshot pass-through on moves", () => {
  beforeEach(() => {
    tripActions.resetForTests();
    tripActions.setActive(tripWithPlan(twoStopPlan()));
    tripActions.setStopTransport({ container: 1, index: 0 }, "drive", DRIVE_ESTIMATE);
  });

  it("keeps the snapshot when reordering within a day", () => {
    tripActions.moveStop({ container: 1, index: 0 }, { container: 1, index: 2 });

    expect(tripStore.state.active!.plan.days[0].stops[1]).toEqual({
      poiId: "poi-a",
      toNext: "drive",
      toNextEstimate: DRIVE_ESTIMATE,
    });
  });

  it("keeps the snapshot when moving across days", () => {
    tripActions.moveStop({ container: 1, index: 0 }, { container: 2, index: 0 });

    expect(tripStore.state.active!.plan.days[1].stops[0]).toEqual({
      poiId: "poi-a",
      toNext: "drive",
      toNextEstimate: DRIVE_ESTIMATE,
    });
  });

  it("drops mode and snapshot when moving to unscheduled (existing semantics)", () => {
    tripActions.moveStop({ container: 1, index: 0 }, { container: "unscheduled", index: 0 });

    expect(tripStore.state.active!.plan.unscheduled[0]).toEqual({ poiId: "poi-a" });
  });
});

describe("display derivation (never written back)", () => {
  beforeEach(() => {
    tripActions.resetForTests();
  });

  it("derives taxi by default and self_drive when the main transport is drive", () => {
    expect(displayToNext({ poiId: "poi-a" }, null)).toBe("drive");
    expect(displayToNext({ poiId: "poi-a" }, "flight")).toBe("drive");
    expect(displayToNext({ poiId: "poi-a" }, "drive")).toBe("self_drive");
    expect(displayToNext({ poiId: "poi-a", toNext: null }, "drive")).toBe("self_drive");
  });

  it("treats legacy transit as the current default without rewriting it", () => {
    expect(displayToNext({ poiId: "poi-a", toNext: "transit" }, null)).toBe("drive");
    expect(displayToNext({ poiId: "poi-a", toNext: "transit" }, "drive")).toBe("self_drive");
  });

  it("keeps explicit saved modes regardless of the main transport", () => {
    expect(displayToNext({ poiId: "poi-a", toNext: "walk" }, "drive")).toBe("walk");
    expect(displayToNext({ poiId: "poi-a", toNext: "drive" }, "drive")).toBe("drive");
    expect(displayToNext({ poiId: "poi-a", toNext: "self_drive" }, "flight")).toBe("self_drive");
    expect(displayToNext({ poiId: "poi-a", toNext: "self_drive" }, null)).toBe("self_drive");
  });

  it("does not mutate the store when deriving", () => {
    tripActions.setActive(tripWithPlan(twoStopPlan(), "drive"));
    const before = tripStore.state.active!.plan;
    displayToNext(before.days[0].stops[0], "drive");

    expect(tripStore.state.active!.plan).toEqual(before);
    expect(tripStore.state.active!.plan.days[0].stops[0].toNext ?? null).toBeNull();
  });

  it("switching the main transport never rewrites saved choices or snapshots", () => {
    tripActions.setActive(tripWithPlan(twoStopPlan(), "drive"));
    tripActions.setStopTransport({ container: 1, index: 0 }, "self_drive", ZERO_ESTIMATE);
    tripActions.setStopTransport({ container: 1, index: 1 }, "walk", null);

    tripActions.setTransportMode("high_speed_rail");

    const stops = tripStore.state.active!.plan.days[0].stops;
    expect(stops[0]).toEqual({ poiId: "poi-a", toNext: "self_drive", toNextEstimate: ZERO_ESTIMATE });
    expect(stops[1].toNext).toBe("walk");
    expect(displayToNext(stops[0], "high_speed_rail")).toBe("self_drive");
  });
});