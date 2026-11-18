import { describe, expect, it } from "vitest";
import type { PetPolicies } from "../queries/locations";
import { displayRating, policyNoteParts } from "./location-summary";

function policies(overrides: Partial<PetPolicies> = {}): PetPolicies {
  return {
    allowedPetTypes: null,
    maxPetsPerPerson: null,
    maxSinglePetWeightKg: null,
    maxSinglePetShoulderHeightCm: null,
    leashRequired: null,
    vaccinationProofRequired: null,
    extraFeeCents: null,
    reservationRequired: null,
    ...overrides,
  };
}

describe("policyNoteParts", () => {
  it("三个布尔项为 true 时按顺序生成短语", () => {
    expect(
      policyNoteParts(
        policies({ leashRequired: true, vaccinationProofRequired: true, reservationRequired: true }),
      ),
    ).toEqual(["公共区域需牵引", "需疫苗证明", "需提前预约"]);
  });

  it("false 与 null 不生成短语", () => {
    expect(policyNoteParts(policies({ leashRequired: false, vaccinationProofRequired: true }))).toEqual([
      "需疫苗证明",
    ]);
  });

  it("无可生成项返回空数组", () => {
    expect(policyNoteParts(policies())).toEqual([]);
    expect(policyNoteParts(policies({ leashRequired: false }))).toEqual([]);
  });
});

describe("displayRating", () => {
  it("数值字符串原样展示", () => {
    expect(displayRating("4.6")).toBe("4.6");
  });

  it("trim 后展示", () => {
    expect(displayRating(" 4.6 ")).toBe("4.6");
  });

  it("null/空白/非数值返回 null", () => {
    expect(displayRating(null)).toBeNull();
    expect(displayRating("")).toBeNull();
    expect(displayRating("   ")).toBeNull();
    expect(displayRating("很好")).toBeNull();
    expect(displayRating("4.6分")).toBeNull();
  });
});