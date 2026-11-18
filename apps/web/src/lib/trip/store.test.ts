import { beforeEach, describe, expect, it } from "vitest";
import { normalizePlan } from "./plan";
import { initialTripState, tripActions, tripStore } from "./store";
import type { Trip } from "./types";

function activeTrip(totalDays = 3): Trip {
  return {
    id: 7,
    name: "杭州 · 3天 · 旺财",
    cityAdcode: "330100",
    petId: 1,
    totalDays,
    startDate: null,
    transportMode: null,
    planCompleted: false,
    plan: { version: 1, days: [], unscheduled: [] },
    createdAt: "2026-11-16T00:00:00Z",
    updatedAt: "2026-11-16T00:00:00Z",
  };
}

describe("trip store", () => {
  beforeEach(() => {
    tripActions.resetForTests();
  });

  it("starts and discards a draft without an active trip", () => {
    tripActions.startDraft("330100", 3, 1);
    expect(tripStore.state.draft).toEqual({ cityAdcode: "330100", totalDays: 3, petId: 1 });
    expect(tripStore.state.panel.expanded).toBe(true);

    tripActions.updateDraft({ totalDays: 5 });
    expect(tripStore.state.draft?.totalDays).toBe(5);

    tripActions.discardDraft();
    expect(tripStore.state.draft).toBeNull();
  });

  it("clears the active trip and collapses its panel", () => {
    tripActions.setActive(activeTrip());
    tripActions.setPanelExpanded(true);
    expect(tripStore.state.editing).toBe(true);

    tripActions.clearActive();

    expect(tripStore.state.active).toBeNull();
    expect(tripStore.state.panel.expanded).toBe(false);
    expect(tripStore.state.editing).toBe(false);
  });

  it("ends the editing state without clearing the active trip", () => {
    tripActions.setActive(activeTrip());

    tripActions.setEditing(false);

    expect(tripStore.state.editing).toBe(false);
    expect(tripStore.state.active?.id).toBe(7);

    tripActions.setEditing(true);
    expect(tripStore.state.editing).toBe(true);
  });

  it("keeps a completed trip read-only", () => {
    tripActions.setActive({ ...activeTrip(2), startDate: "2020-01-01" });
    const revision = tripStore.state.saveRevision;

    tripActions.addStop(1, "poi-a");
    tripActions.setTransportMode("flight");

    expect(tripStore.state.active?.plan.days).toEqual([]);
    expect(tripStore.state.active?.transportMode).toBeNull();
    expect(tripStore.state.active?.startDate).toBe("2020-01-01");
    expect(tripStore.state.saveRevision).toBe(revision);
  });

  it("updates transport mode and increments the save revision only when it changes", () => {
    tripActions.setActive(activeTrip());
    const revision = tripStore.state.saveRevision;

    tripActions.setTransportMode("flight");
    expect(tripStore.state.active?.transportMode).toBe("flight");
    expect(tripStore.state.saveRevision).toBe(revision + 1);

    tripActions.setTransportMode("flight");
    expect(tripStore.state.saveRevision).toBe(revision + 1);
  });

  it("adds stops to a day and clears the same poi from unscheduled", () => {
    tripActions.setActive(activeTrip());
    tripActions.addStop("unscheduled", "poi-a");
    tripActions.addStop(2, "poi-a");
    tripActions.addStop(2, "poi-b");
    tripActions.addStop(2, "poi-a");

    const plan = tripStore.state.active!.plan;
    const day = plan.days.find((entry) => entry.day === 2);
    expect(day?.stops.map((stop) => stop.poiId)).toEqual(["poi-a", "poi-b", "poi-a"]);
    expect(plan.unscheduled).toEqual([]);
    expect(tripStore.state.saveRevision).toBeGreaterThan(0);
  });

  it("keeps unscheduled deduplicated and refuses already scheduled stops", () => {
    tripActions.setActive(activeTrip());
    tripActions.addStop("unscheduled", "poi-a");
    tripActions.addStop("unscheduled", "poi-a");
    expect(tripStore.state.active!.plan.unscheduled).toEqual([{ poiId: "poi-a" }]);

    tripActions.addStop(1, "poi-a");
    tripActions.addStop("unscheduled", "poi-a");
    expect(
      tripStore.state.active!.plan.days.find((entry) => entry.day === 1)?.stops,
    ).toEqual([{ poiId: "poi-a" }]);
    expect(tripStore.state.active!.plan.unscheduled).toEqual([]);
  });

  it("reorders within a day and moves across days", () => {
    tripActions.setActive(activeTrip());
    tripActions.addStop(1, "poi-a");
    tripActions.addStop(1, "poi-b");
    tripActions.addStop(2, "poi-c");

    tripActions.moveStop({ container: 1, index: 1 }, { container: 1, index: 0 });
    expect(tripStore.state.active!.plan.days[0].stops.map((stop) => stop.poiId)).toEqual([
      "poi-b",
      "poi-a",
    ]);

    tripActions.moveStop({ container: 1, index: 0 }, { container: 2, index: 0 });
    const plan = tripStore.state.active!.plan;
    expect(plan.days[0].stops.map((stop) => stop.poiId)).toEqual(["poi-a"]);
    expect(plan.days[1].stops.map((stop) => stop.poiId)).toEqual(["poi-b", "poi-c"]);

    tripActions.moveStop({ container: 1, index: 0 }, { container: "unscheduled", index: 0 });
    expect(tripStore.state.active!.plan.unscheduled).toEqual([{ poiId: "poi-a" }]);
  });

  it("removes stops and updates the save revision", () => {
    tripActions.setActive(activeTrip());
    tripActions.addStop(1, "poi-a");
    tripActions.addStop(1, "poi-b");
    const before = tripStore.state.saveRevision;

    tripActions.removeStop({ container: 1, index: 0 });
    expect(tripStore.state.active!.plan.days[0].stops).toEqual([{ poiId: "poi-b" }]);
    expect(tripStore.state.saveRevision).toBe(before + 1);
  });

  it("caches city, pets and locations", () => {
    tripActions.cacheCity({ adcode: "330100", name: "杭州市", province: "浙江省" });
    tripActions.cachePets([
      {
        id: 1,
        name: "旺财",
        petType: "DOG",
        weightKg: 10,
        shoulderHeightCm: 40,
        hasLeash: true,
        hasVaccinationProof: true,
        photo: null,
        dogBreed: null,
        preferences: [],
        personality: null,
      },
    ]);
    tripActions.cacheLocation({
      poiId: "poi-a",
      name: "西湖",
      typeCode: "110000",
      typeGroup: "attraction",
      address: "杭州",
      regionCode: "330100",
      petPolicies: {
        allowedPetTypes: null,
        maxPetsPerPerson: 1,
        maxSinglePetWeightKg: null,
        maxSinglePetShoulderHeightCm: null,
        leashRequired: null,
        vaccinationProofRequired: null,
        extraFeeCents: null,
        reservationRequired: null,
      },
      coverPhotoUrl: null,
      rating: null,
    });

    expect(tripStore.state.cache.city?.name).toBe("杭州市");
    expect(tripStore.state.cache.pets[1]?.name).toBe("旺财");
    expect(tripStore.state.cache.locations["poi-a"]?.name).toBe("西湖");
  });

  it("returns to the initial state on logout", () => {
    tripActions.setActive(activeTrip());
    tripActions.startDraft("440400", 2, 1);
    tripActions.clearTripContext();
    expect(tripStore.state).toEqual({
      ...initialTripState,
      cache: { city: null, pets: {}, locations: {} },
    });
  });
});

describe("plan normalization", () => {
  it("fills empty days and drops scheduled locations from unscheduled", () => {
    const plan = normalizePlan(
      {
        version: 1,
        days: [{ day: 2, stops: [{ poiId: "poi-a" }] }],
        unscheduled: [{ poiId: "poi-a" }, { poiId: "poi-b" }, { poiId: "poi-b" }],
      },
      3,
    );
    expect(plan.days.map((day) => day.day)).toEqual([1, 2, 3]);
    expect(plan.days[1].stops).toEqual([{ poiId: "poi-a" }]);
    expect(plan.unscheduled).toEqual([{ poiId: "poi-b" }]);
  });

  it("drops days outside the total duration", () => {
    const plan = normalizePlan(
      {
        version: 1,
        days: [
          { day: 1, stops: [{ poiId: "poi-a" }] },
          { day: 5, stops: [{ poiId: "poi-b" }] },
        ],
        unscheduled: [],
      },
      2,
    );
    expect(plan.days.map((day) => day.day)).toEqual([1, 2]);
    expect(plan.days.flatMap((day) => day.stops)).toEqual([{ poiId: "poi-a" }]);
  });
});
