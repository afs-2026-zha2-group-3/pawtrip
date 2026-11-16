import { describe, expect, it } from "vitest";
import {
  formatAllowedPetTypes,
  formatBooleanRequirement,
  formatFee,
  petFriendlyLabel,
  petFriendlyStatus,
  petPolicyFields,
  type AttractionPetPolicies,
} from "./attraction-pet-rules";

const fullPolicies: AttractionPetPolicies = {
  allowedPetTypes: "DOG",
  maxPetsPerPerson: 1,
  maxSinglePetWeightKg: 8.5,
  maxSinglePetShoulderHeightCm: 40,
  leashRequired: true,
  vaccinationProofRequired: false,
  extraFeeCents: 1050,
  reservationRequired: null,
};

describe("attraction pet rules", () => {
  it("derives friendly status from maxPetsPerPerson", () => {
    expect(petFriendlyStatus(1)).toBe("friendly");
    expect(petFriendlyStatus(2)).toBe("friendly");
    expect(petFriendlyStatus(0)).toBe("forbidden");
    expect(petFriendlyStatus(null)).toBe("unconfigured");
  });

  it("returns Chinese labels for the derived status", () => {
    expect(petFriendlyLabel(1)).toBe("宠物友好");
    expect(petFriendlyLabel(0)).toBe("禁止携带");
    expect(petFriendlyLabel(null)).toBe("未配置");
  });

  it("formats allowed pet types", () => {
    expect(formatAllowedPetTypes("CAT")).toBe("猫");
    expect(formatAllowedPetTypes("DOG")).toBe("狗");
    expect(formatAllowedPetTypes("CAT,DOG")).toBe("猫和狗");
    expect(formatAllowedPetTypes(null)).toBeNull();
  });

  it("formats boolean requirements and fees", () => {
    expect(formatBooleanRequirement(true)).toBe("需要");
    expect(formatBooleanRequirement(false)).toBe("不需要");
    expect(formatBooleanRequirement(null)).toBeNull();
    expect(formatFee(1050)).toBe("10.5 元 / 只 / 次");
    expect(formatFee(1)).toBe("0.01 元 / 只 / 次");
    expect(formatFee(0)).toBe("0 元 / 只 / 次");
    expect(formatFee(null)).toBeNull();
  });

  it("builds only non-null policy fields", () => {
    expect(petPolicyFields(fullPolicies)).toEqual([
      { label: "允许宠物类型", value: "狗" },
      { label: "每位游客最多携带", value: "1 只 / 人" },
      { label: "单只宠物最大体重", value: "8.5 kg" },
      { label: "单只宠物最大肩高", value: "40 cm" },
      { label: "牵引绳要求", value: "需要" },
      { label: "疫苗证明要求", value: "不需要" },
      { label: "额外费用", value: "10.5 元 / 只 / 次" },
    ]);
    expect(petPolicyFields({
      ...fullPolicies,
      allowedPetTypes: null,
      maxSinglePetWeightKg: null,
      maxSinglePetShoulderHeightCm: null,
      leashRequired: null,
      vaccinationProofRequired: null,
      extraFeeCents: null,
    })).toEqual([
      { label: "每位游客最多携带", value: "1 只 / 人" },
    ]);
  });
});
