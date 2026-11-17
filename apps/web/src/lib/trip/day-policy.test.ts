import { describe, expect, it } from "vitest";
import { dayPolicyLines, deriveDayPolicy, sizeWarningLine, type DayPolicyPet } from "./day-policy";
import type { LocationBrowseDetail, PetPolicies } from "@/queries/locations";
import type { TripStop } from "./types";

function policies(patch: Partial<PetPolicies> = {}): PetPolicies {
  return {
    allowedPetTypes: null,
    maxPetsPerPerson: null,
    maxSinglePetWeightKg: null,
    maxSinglePetShoulderHeightCm: null,
    leashRequired: null,
    vaccinationProofRequired: null,
    extraFeeCents: null,
    reservationRequired: null,
    ...patch,
  };
}

function location(poiId: string, name: string, patch: Partial<PetPolicies> = {}): LocationBrowseDetail {
  return {
    poiId,
    name,
    typeCode: "110000",
    typeGroup: "attraction",
    address: null,
    regionCode: null,
    petPolicies: policies(patch),
    coverPhotoUrl: null,
    rating: null,
  };
}

const PET: DayPolicyPet = { hasLeash: true, weightKg: 8, shoulderHeightCm: 35 };

const A: TripStop = { poiId: "poi-a" };
const B: TripStop = { poiId: "poi-b" };

describe("leash aggregation", () => {
  it("requires a leash when any scheduled stop demands one", () => {
    const locations = {
      "poi-a": location("poi-a", "景点A"),
      "poi-b": location("poi-b", "景点B", { leashRequired: true }),
    };
    expect(deriveDayPolicy([A, B], locations, PET).leash).toBe("required");
  });

  it("strengthens the reminder when the profile has no leash registered", () => {
    const locations = { "poi-a": location("poi-a", "景点A", { leashRequired: true }) };
    const pet: DayPolicyPet = { ...PET, hasLeash: false };
    expect(deriveDayPolicy([A], locations, pet).leash).toBe("required-no-leash");
  });

  it("keeps plain required when the profile is missing or hasLeash is unknown", () => {
    const locations = { "poi-a": location("poi-a", "景点A", { leashRequired: true }) };
    expect(deriveDayPolicy([A], locations, null).leash).toBe("required");
    expect(deriveDayPolicy([A], locations, { ...PET, hasLeash: null }).leash).toBe("required");
  });

  it("returns null when no stop requires a leash", () => {
    const locations = {
      "poi-a": location("poi-a", "景点A", { leashRequired: false }),
      "poi-b": location("poi-b", "景点B"),
    };
    expect(deriveDayPolicy([A, B], locations, PET).leash).toBeNull();
  });
});

describe("size warnings", () => {
  it("warns with the attraction name and limit only when strictly exceeded", () => {
    const locations = { "poi-a": location("poi-a", "景点A", { maxSinglePetWeightKg: 10 }) };
    const over: DayPolicyPet = { ...PET, weightKg: 15 };
    expect(deriveDayPolicy([A], locations, over).sizeWarnings).toEqual([
      { poiId: "poi-a", name: "景点A", weightLimitKg: 10, heightLimitCm: null },
    ]);

    const equal: DayPolicyPet = { ...PET, weightKg: 10 };
    expect(deriveDayPolicy([A], locations, equal).sizeWarnings).toEqual([]);
    const under: DayPolicyPet = { ...PET, weightKg: 8 };
    expect(deriveDayPolicy([A], locations, under).sizeWarnings).toEqual([]);
  });

  it("warns on shoulder height independently and combines both dimensions", () => {
    const locations = {
      "poi-a": location("poi-a", "景点A", { maxSinglePetShoulderHeightCm: 40 }),
      "poi-b": location("poi-b", "景点B", { maxSinglePetWeightKg: 8.5, maxSinglePetShoulderHeightCm: 40 }),
    };
    const pet: DayPolicyPet = { hasLeash: true, weightKg: 38, shoulderHeightCm: 55 };
    expect(deriveDayPolicy([A, B], locations, pet).sizeWarnings).toEqual([
      { poiId: "poi-a", name: "景点A", weightLimitKg: null, heightLimitCm: 40 },
      { poiId: "poi-b", name: "景点B", weightLimitKg: 8.5, heightLimitCm: 40 },
    ]);
  });

  it("skips dimensions with missing profile values and missing profiles entirely", () => {
    const locations = {
      "poi-a": location("poi-a", "景点A", { maxSinglePetWeightKg: 10, maxSinglePetShoulderHeightCm: 40 }),
    };
    const partial: DayPolicyPet = { hasLeash: true, weightKg: null, shoulderHeightCm: 55 };
    expect(deriveDayPolicy([A], locations, partial).sizeWarnings).toEqual([
      { poiId: "poi-a", name: "景点A", weightLimitKg: null, heightLimitCm: 40 },
    ]);
    expect(deriveDayPolicy([A], locations, null).sizeWarnings).toEqual([]);
  });

  it("skips stops missing from the cache and null policies", () => {
    const locations = { "poi-b": location("poi-b", "景点B") };
    const pet: DayPolicyPet = { ...PET, weightKg: 999, shoulderHeightCm: 999 };
    expect(deriveDayPolicy([A, B], locations, pet)).toEqual({ leash: null, sizeWarnings: [] });
    expect(deriveDayPolicy([A], {}, pet)).toEqual({ leash: null, sizeWarnings: [] });
  });

  it("deduplicates repeated poiIds keeping stop order", () => {
    const locations = {
      "poi-a": location("poi-a", "景点A", { maxSinglePetWeightKg: 10 }),
      "poi-b": location("poi-b", "景点B", { maxSinglePetWeightKg: 5 }),
    };
    const pet: DayPolicyPet = { ...PET, weightKg: 15 };
    const warnings = deriveDayPolicy([A, B, A], locations, pet).sizeWarnings;
    expect(warnings.map((warning) => warning.poiId)).toEqual(["poi-a", "poi-b"]);
  });
});

describe("empty results", () => {
  it("outputs an empty reminder for empty days or no triggers", () => {
    expect(deriveDayPolicy([], {}, PET)).toEqual({ leash: null, sizeWarnings: [] });
    const locations = { "poi-a": location("poi-a", "景点A") };
    expect(deriveDayPolicy([A], locations, PET)).toEqual({ leash: null, sizeWarnings: [] });
  });
});

describe("dayPolicyLines", () => {
  it("renders no lines for an empty reminder", () => {
    expect(dayPolicyLines({ leash: null, sizeWarnings: [] })).toEqual([]);
  });

  it("renders the leash line and its strengthened variant", () => {
    expect(dayPolicyLines({ leash: "required", sizeWarnings: [] })).toEqual(["当天需携带牵引绳"]);
    expect(dayPolicyLines({ leash: "required-no-leash", sizeWarnings: [] })).toEqual([
      "当天需携带牵引绳（档案未登记牵引绳，请自备）",
    ]);
  });

  it("keeps only the leash line; size warnings render below their own stop", () => {
    expect(
      dayPolicyLines({
        leash: "required",
        sizeWarnings: [
          { poiId: "poi-a", name: "景点A", weightLimitKg: 10, heightLimitCm: null },
        ],
      }),
    ).toEqual(["当天需携带牵引绳"]);
    expect(
      dayPolicyLines({
        leash: null,
        sizeWarnings: [
          { poiId: "poi-a", name: "景点A", weightLimitKg: 10, heightLimitCm: null },
        ],
      }),
    ).toEqual([]);
  });
});

describe("sizeWarningLine", () => {
  it("names the pet, the attraction and each exceeded limit", () => {
    expect(
      sizeWarningLine({ poiId: "poi-a", name: "景点A", weightLimitKg: 10, heightLimitCm: null }, "毛毛"),
    ).toBe("您的宠物「毛毛」超出景点 景点A 限制（≤10kg）");
    expect(
      sizeWarningLine({ poiId: "poi-b", name: "景点B", weightLimitKg: 8.5, heightLimitCm: 40 }, "毛毛"),
    ).toBe("您的宠物「毛毛」超出景点 景点B 限制（≤8.5kg/≤40cm）");
    expect(
      sizeWarningLine({ poiId: "poi-c", name: "景点C", weightLimitKg: null, heightLimitCm: 40 }, "豆豆"),
    ).toBe("您的宠物「豆豆」超出景点 景点C 限制（≤40cm）");
  });

  it("falls back to the unnamed subject when the pet name is missing", () => {
    expect(
      sizeWarningLine({ poiId: "poi-a", name: "景点A", weightLimitKg: 10, heightLimitCm: null }, null),
    ).toBe("您的宠物超出景点 景点A 限制（≤10kg）");
  });
});