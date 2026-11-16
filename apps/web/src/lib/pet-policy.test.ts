import { describe, expect, it } from "vitest";
import {
  allowedPetTypesFromSelection,
  allowedPetTypesSelectionFrom,
  booleanFromTriState,
  emptyPetPolicyDraft,
  formatCentsAsYuan,
  petPoliciesFromDraft,
  petPolicyDraftFrom,
  triStateFromBoolean,
} from "./pet-policy";

describe("petPoliciesFromDraft", () => {
  it("maps empty fields to nulls", () => {
    expect(petPoliciesFromDraft(emptyPetPolicyDraft)).toEqual({
      policies: {
        allowedPetTypes: null,
        maxPetsPerPerson: null,
        maxSinglePetWeightKg: null,
        maxSinglePetShoulderHeightCm: null,
        leashRequired: null,
        vaccinationProofRequired: null,
        extraFeeCents: null,
        reservationRequired: null,
      },
    });
  });

  it("keeps zero as an explicit value", () => {
    expect(petPoliciesFromDraft({
      ...emptyPetPolicyDraft,
      maxPetsPerPerson: "0",
      maxSinglePetWeightKg: "0",
      maxSinglePetShoulderHeightCm: "0",
      extraFeeYuan: "0",
    })).toEqual({
      policies: {
        allowedPetTypes: null,
        maxPetsPerPerson: 0,
        maxSinglePetWeightKg: 0,
        maxSinglePetShoulderHeightCm: 0,
        leashRequired: null,
        vaccinationProofRequired: null,
        extraFeeCents: 0,
        reservationRequired: null,
      },
    });
  });

  it("parses shoulder height with up to two decimals", () => {
    expect(petPoliciesFromDraft({
      ...emptyPetPolicyDraft,
      maxSinglePetShoulderHeightCm: "38.25",
    })).toEqual({
      policies: expect.objectContaining({ maxSinglePetShoulderHeightCm: 38.25 }),
    });
    expect(petPoliciesFromDraft({
      ...emptyPetPolicyDraft,
      maxSinglePetShoulderHeightCm: "-1",
    })).toEqual({
      error: { field: "maxSinglePetShoulderHeightCm", message: expect.any(String) },
    });
    expect(petPoliciesFromDraft({
      ...emptyPetPolicyDraft,
      maxSinglePetShoulderHeightCm: "8.751",
    })).toEqual({
      error: { field: "maxSinglePetShoulderHeightCm", message: expect.any(String) },
    });
  });

  it("maps allowed pet type selections", () => {
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, allowedPetTypes: "cat" })).toEqual({
      policies: expect.objectContaining({ allowedPetTypes: "CAT" }),
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, allowedPetTypes: "dog" })).toEqual({
      policies: expect.objectContaining({ allowedPetTypes: "DOG" }),
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, allowedPetTypes: "cat-dog" })).toEqual({
      policies: expect.objectContaining({ allowedPetTypes: "CAT,DOG" }),
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, allowedPetTypes: "unset" })).toEqual({
      policies: expect.objectContaining({ allowedPetTypes: null }),
    });
  });

  it("converts yuan to integer cents", () => {
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, extraFeeYuan: "10.5" })).toEqual({
      policies: expect.objectContaining({ extraFeeCents: 1050 }),
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, extraFeeYuan: "0.01" })).toEqual({
      policies: expect.objectContaining({ extraFeeCents: 1 }),
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, extraFeeYuan: "10.05" })).toEqual({
      policies: expect.objectContaining({ extraFeeCents: 1005 }),
    });
  });

  it("rejects negative, fractional counts and more than two decimals", () => {
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, maxPetsPerPerson: "-1" })).toEqual({
      error: { field: "maxPetsPerPerson", message: expect.any(String) },
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, maxPetsPerPerson: "1.5" })).toEqual({
      error: { field: "maxPetsPerPerson", message: expect.any(String) },
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, maxSinglePetWeightKg: "8.751" })).toEqual({
      error: { field: "maxSinglePetWeightKg", message: expect.any(String) },
    });
    expect(petPoliciesFromDraft({ ...emptyPetPolicyDraft, extraFeeYuan: "10.001" })).toEqual({
      error: { field: "extraFeeYuan", message: expect.any(String) },
    });
  });
});

describe("pet policy presentation helpers", () => {
  it("formats cents as trimmed yuan", () => {
    expect(formatCentsAsYuan(null)).toBe("");
    expect(formatCentsAsYuan(0)).toBe("0");
    expect(formatCentsAsYuan(1050)).toBe("10.5");
    expect(formatCentsAsYuan(1005)).toBe("10.05");
  });

  it("round-trips tri-state booleans", () => {
    expect(triStateFromBoolean(true)).toBe("required");
    expect(triStateFromBoolean(false)).toBe("not-required");
    expect(triStateFromBoolean(null)).toBe("unset");
    expect(booleanFromTriState("required")).toBe(true);
    expect(booleanFromTriState("not-required")).toBe(false);
    expect(booleanFromTriState("unset")).toBeNull();
  });

  it("round-trips allowed pet type selections", () => {
    expect(allowedPetTypesSelectionFrom("CAT")).toBe("cat");
    expect(allowedPetTypesSelectionFrom("DOG")).toBe("dog");
    expect(allowedPetTypesSelectionFrom("CAT,DOG")).toBe("cat-dog");
    expect(allowedPetTypesSelectionFrom(null)).toBe("unset");
    expect(allowedPetTypesFromSelection("cat")).toBe("CAT");
    expect(allowedPetTypesFromSelection("dog")).toBe("DOG");
    expect(allowedPetTypesFromSelection("cat-dog")).toBe("CAT,DOG");
    expect(allowedPetTypesFromSelection("unset")).toBeNull();
  });

  it("prefills a draft from saved policies", () => {
    expect(petPolicyDraftFrom({
      allowedPetTypes: "CAT,DOG",
      maxPetsPerPerson: 1,
      maxSinglePetWeightKg: 8.75,
      maxSinglePetShoulderHeightCm: 38.25,
      leashRequired: true,
      vaccinationProofRequired: false,
      extraFeeCents: 1050,
      reservationRequired: null,
    })).toEqual({
      allowedPetTypes: "cat-dog",
      maxPetsPerPerson: "1",
      maxSinglePetWeightKg: "8.75",
      maxSinglePetShoulderHeightCm: "38.25",
      leashRequired: "required",
      vaccinationProofRequired: "not-required",
      extraFeeYuan: "10.5",
      reservationRequired: "unset",
    });
    expect(petPolicyDraftFrom(null)).toEqual(emptyPetPolicyDraft);
  });
});
