import { describe, expect, it } from "vitest";
import type { LocationBrowseDetail } from "@/queries/locations";
import { attractionAnchors, scheduledPoiIds } from "./anchors";
import type { Trip } from "./types";

function tripWithPlan(days: Trip["plan"]["days"], unscheduled: Trip["plan"]["unscheduled"] = []): Trip {
  return {
    id: 1,
    name: "珠海两日",
    cityAdcode: "440400",
    petId: 1,
    totalDays: 2,
    startDate: null,
    transportMode: null,
    planCompleted: false,
    plan: { version: 1, days, unscheduled },
    createdAt: "2026-11-17T00:00:00Z",
    updatedAt: "2026-11-17T00:00:00Z",
  };
}

function detail(poiId: string, name: string, typeGroup: string): LocationBrowseDetail {
  return {
    poiId,
    name,
    typeCode: "110000",
    typeGroup,
    address: null,
    regionCode: "440402",
    coverPhotoUrl: null,
    rating: null,
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
  };
}

describe("scheduled attraction anchors", () => {
  it("collects scheduled stops once and ignores unscheduled stops", () => {
    const trip = tripWithPlan(
      [
        { day: 1, stops: [{ poiId: "attraction-a" }, { poiId: "hotel-a" }] },
        { day: 2, stops: [{ poiId: "attraction-a" }, { poiId: "attraction-b" }] },
      ],
      [{ poiId: "attraction-unscheduled" }],
    );

    expect(scheduledPoiIds(trip)).toEqual(["attraction-a", "hotel-a", "attraction-b"]);
  });

  it("keeps only scheduled attractions with loaded details", () => {
    const trip = tripWithPlan(
      [
        { day: 1, stops: [{ poiId: "attraction-a" }, { poiId: "hotel-a" }] },
        { day: 2, stops: [{ poiId: "attraction-b" }, { poiId: "attraction-missing" }] },
      ],
      [{ poiId: "attraction-unscheduled" }],
    );
    const locations = {
      "attraction-a": detail("attraction-a", "长隆海洋王国", "attraction"),
      "attraction-b": detail("attraction-b", "情侣路", "attraction"),
      "hotel-a": detail("hotel-a", "某酒店", "hotel"),
      "attraction-unscheduled": detail("attraction-unscheduled", "未排期景点", "attraction"),
    };

    expect(attractionAnchors(scheduledPoiIds(trip), locations)).toEqual([
      { poiId: "attraction-a", name: "长隆海洋王国" },
      { poiId: "attraction-b", name: "情侣路" },
    ]);
  });

  it("returns no anchors without an active trip", () => {
    expect(scheduledPoiIds(null)).toEqual([]);
    expect(attractionAnchors([], {})).toEqual([]);
  });
});
