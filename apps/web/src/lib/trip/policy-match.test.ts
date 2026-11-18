import { describe, expect, it } from "vitest";
import type { AttractionPetPolicies } from "@/lib/attraction-pet-rules";
import type { DestinationCandidate } from "@/lib/destination-matching";
import type { CityPetPolicy } from "@/queries/city-pet-policy";
import type { Pet } from "@/queries/pets";
import {
  matchLocationPolicy,
  matchLocationPolicyForType,
  matchCityCandidate,
  matchCityPolicy,
} from "./policy-match";

const dog: Pet = {
  id: 1,
  name: "旺财",
  petType: "DOG",
  weightKg: 10,
  shoulderHeightCm: 40,
  hasLeash: true,
  hasVaccinationProof: true,
  photo: null,
  dogBreed: { id: 3, name: "柯基犬", officialAggressive: false },
  preferences: [],
  personality: null,
};

const cat: Pet = {
  ...dog,
  id: 2,
  name: "咪咪",
  petType: "CAT",
  dogBreed: null,
};

const noBreedDog: Pet = { ...dog, id: 4, name: "大黄", dogBreed: null };

const emptyPolicies: AttractionPetPolicies = {
  allowedPetTypes: null,
  maxPetsPerPerson: null,
  maxSinglePetWeightKg: null,
  maxSinglePetShoulderHeightCm: null,
  leashRequired: null,
  vaccinationProofRequired: null,
  extraFeeCents: null,
  reservationRequired: null,
};

const city: DestinationCandidate = {
  adcode: "440400",
  name: "珠海市",
  province: "广东省",
  policyCovered: false,
  bannedBreeds: [],
  allowedPetTypes: "CAT,DOG",
  allowedDogBreedIds: [3],
  maxSinglePetShoulderHeightCm: null,
  featureTags: [],
};

const cityPolicy: CityPetPolicy = {
  adcode: "440400",
  name: "珠海市",
  covered: true,
  areaScope: null,
  policies: [],
  bannedBreeds: [],
  allowedBreeds: ["柯基犬"],
  allowedPetTypes: "CAT,DOG",
  source: null,
  updatedMonth: null,
  match: null,
};

describe("city candidate matching", () => {
  it("is unfriendly when the pet type is not allowed", () => {
    expect(matchCityCandidate({ ...city, allowedPetTypes: "CAT" }, dog).status).toBe(
      "unfriendly",
    );
  });

  it("treats an empty allowed breed list as unconfigured and passes", () => {
    const verdict = matchCityCandidate({ ...city, allowedDogBreedIds: [] }, dog);
    expect(verdict.status).toBe("friendly");
  });

  it("is unfriendly when the breed is not allowed", () => {
    const verdict = matchCityCandidate({ ...city, allowedDogBreedIds: [9] }, dog);
    expect(verdict.status).toBe("unfriendly");
    expect(verdict.reasons[0]).toContain("柯基犬");
  });

  it("is unfriendly when shoulder height exceeds the city cap", () => {
    expect(
      matchCityCandidate({ ...city, maxSinglePetShoulderHeightCm: 35 }, dog).status,
    ).toBe("unfriendly");
  });

  it("treats cats as friendly when the city allows them", () => {
    expect(matchCityCandidate(city, cat)).toEqual({
      status: "friendly",
      reasons: ["城市禁养犬种名单不适用于猫，未限制携带猫"],
    });
    expect(matchCityCandidate({ ...city, allowedPetTypes: "DOG" }, cat).status).toBe(
      "unfriendly",
    );
    expect(matchCityCandidate({ ...city, allowedPetTypes: null }, cat).status).toBe(
      "unfriendly",
    );
  });

  it("is unjudgeable for dogs without a breed", () => {
    expect(matchCityCandidate(city, noBreedDog).status).toBe("unjudgeable");
  });
});

describe("city policy page matching", () => {
  it("treats cats as friendly when the city allows them", () => {
    expect(matchCityPolicy(cityPolicy, cat)).toEqual({
      status: "friendly",
      reasons: ["城市禁养犬种名单不适用于猫，未限制携带猫"],
    });
    expect(matchCityPolicy({ ...cityPolicy, allowedPetTypes: "DOG" }, cat).status).toBe(
      "unfriendly",
    );
  });

  it("is unfriendly for cats when the city has no allowed pet types", () => {
    expect(
      matchCityPolicy({ ...cityPolicy, allowedPetTypes: null }, cat).status,
    ).toBe("unfriendly");
  });

  it("is unjudgeable for unknown breeds", () => {
    expect(matchCityPolicy(cityPolicy, noBreedDog).status).toBe("unjudgeable");
  });

  it("is unfriendly when the breed is banned", () => {
    expect(
      matchCityPolicy({ ...cityPolicy, bannedBreeds: ["柯基犬"] }, dog).status,
    ).toBe("unfriendly");
  });

  it("is friendly when the breed is allowed", () => {
    expect(matchCityPolicy(cityPolicy, dog).status).toBe("friendly");
  });

  it("is unconfigured when the city has no allowed breed list", () => {
    expect(matchCityPolicy({ ...cityPolicy, allowedBreeds: [] }, dog).status).toBe(
      "unconfigured",
    );
  });
});

describe("location policy matching", () => {
  it("is unconfigured when every dimension is null", () => {
    expect(matchLocationPolicy(emptyPolicies, dog).status).toBe("unconfigured");
  });

  it("is unfriendly when the pet type is not allowed", () => {
    expect(
      matchLocationPolicy({ ...emptyPolicies, allowedPetTypes: "CAT" }, dog).status,
    ).toBe("unfriendly");
  });

  it("is unfriendly when the per-person limit is zero", () => {
    expect(
      matchLocationPolicy({ ...emptyPolicies, maxPetsPerPerson: 0 }, dog).status,
    ).toBe("unfriendly");
  });

  it("is unfriendly when weight or shoulder height exceeds the cap", () => {
    expect(
      matchLocationPolicy({ ...emptyPolicies, maxSinglePetWeightKg: 6 }, dog).status,
    ).toBe("unfriendly");
    expect(
      matchLocationPolicy({ ...emptyPolicies, maxSinglePetShoulderHeightCm: 30 }, dog)
        .status,
    ).toBe("unfriendly");
  });

  it("ignores the shoulder height cap for cats", () => {
    const verdict = matchLocationPolicy(
      { ...emptyPolicies, maxSinglePetShoulderHeightCm: 25 },
      { ...cat, shoulderHeightCm: 30 },
    );
    expect(verdict).toEqual({ status: "friendly", reasons: [] });
  });

  it("still applies type, weight and requirement limits to cats", () => {
    expect(
      matchLocationPolicy({ ...emptyPolicies, allowedPetTypes: "DOG" }, cat).status,
    ).toBe("unfriendly");
    expect(
      matchLocationPolicy({ ...emptyPolicies, maxSinglePetWeightKg: 3 }, cat).status,
    ).toBe("unfriendly");
    expect(
      matchLocationPolicy(
        { ...emptyPolicies, vaccinationProofRequired: true },
        { ...cat, hasVaccinationProof: false },
      ).reasons[0],
    ).toContain("疫苗证明");
    expect(
      matchLocationPolicy(
        { ...emptyPolicies, leashRequired: true },
        { ...cat, hasLeash: false },
      ).status,
    ).toBe("unfriendly");
  });

  it("is unfriendly when leash or vaccination requirements are unmet", () => {
    expect(
      matchLocationPolicy(
        { ...emptyPolicies, leashRequired: true },
        { ...dog, hasLeash: false },
      ).status,
    ).toBe("unfriendly");
    expect(
      matchLocationPolicy(
        { ...emptyPolicies, vaccinationProofRequired: true },
        { ...dog, hasVaccinationProof: false },
      ).status,
    ).toBe("unfriendly");
  });

  it("skips null dimensions instead of reporting unfriendly", () => {
    const verdict = matchLocationPolicy(
      { ...emptyPolicies, maxPetsPerPerson: 1, maxSinglePetWeightKg: null },
      dog,
    );
    expect(verdict.status).toBe("friendly");
  });

  it("ignores fee and reservation fields in the verdict", () => {
    expect(
      matchLocationPolicy(
        { ...emptyPolicies, extraFeeCents: 1000, reservationRequired: true },
        dog,
      ).status,
    ).toBe("unconfigured");
  });

  it("treats unconfigured hospitals and supply stores as pet friendly", () => {
    expect(matchLocationPolicyForType("pet-hospital", emptyPolicies, dog).status).toBe(
      "friendly",
    );
    expect(matchLocationPolicyForType("pet-supplies", emptyPolicies, cat).status).toBe(
      "friendly",
    );
    expect(matchLocationPolicyForType("attraction", emptyPolicies, dog).status).toBe(
      "unconfigured",
    );
  });

  it("still evaluates configured policies for exempt location types", () => {
    expect(
      matchLocationPolicyForType(
        "pet-supplies",
        { ...emptyPolicies, maxPetsPerPerson: 0 },
        dog,
      ).status,
    ).toBe("unfriendly");
  });
});
