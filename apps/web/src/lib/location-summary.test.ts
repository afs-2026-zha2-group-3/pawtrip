import { describe, expect, it } from "vitest";
import type { PetPolicies } from "../queries/locations";
import {
  displayRating,
  locationDescription,
  normalizeLocationType,
  policyNoteParts,
} from "./location-summary";

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

describe("locationDescription", () => {
  it("优先使用简介", () => {
    expect(locationDescription({ description: "海边步道", address: "情侣路" })).toBe(
      "海边步道",
    );
  });

  it("简介为空串或纯空白时回退地址", () => {
    expect(locationDescription({ description: "", address: "情侣路" })).toBe("情侣路");
    expect(locationDescription({ description: "   ", address: "情侣路" })).toBe("情侣路");
  });

  it("简介缺失时回退地址", () => {
    expect(locationDescription({ description: null, address: "情侣路" })).toBe("情侣路");
    expect(locationDescription({ address: "情侣路" })).toBe("情侣路");
  });

  it("简介与地址都缺失时展示地址未收录", () => {
    expect(locationDescription({})).toBe("地址未收录");
    expect(locationDescription({ description: null, address: null })).toBe("地址未收录");
    expect(locationDescription({ description: " ", address: "  " })).toBe("地址未收录");
  });
});

describe("normalizeLocationType", () => {
  it("合法类型原样返回", () => {
    expect(normalizeLocationType("hotel")).toBe("hotel");
    expect(normalizeLocationType("restaurant")).toBe("restaurant");
    expect(normalizeLocationType("attraction")).toBe("attraction");
  });

  it("缺失或非法值回退景点", () => {
    expect(normalizeLocationType(undefined)).toBe("attraction");
    expect(normalizeLocationType(null)).toBe("attraction");
    expect(normalizeLocationType("park")).toBe("attraction");
    expect(normalizeLocationType("Attraction")).toBe("attraction");
    expect(normalizeLocationType("HOTEL")).toBe("attraction");
    expect(normalizeLocationType(["hotel"])).toBe("attraction");
    expect(normalizeLocationType(123)).toBe("attraction");
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