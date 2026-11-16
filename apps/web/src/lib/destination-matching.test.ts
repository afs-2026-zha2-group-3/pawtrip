import { describe, expect, it } from "vitest";
import { breedHitsBanList, matchesCityPetPolicy } from "./destination-matching";
import type { DestinationCandidate } from "./destination-matching";

describe("breedHitsBanList", () => {
  const bans = [{ breedName: "比特犬" }, { breedName: "日本土佐" }];

  it("matches breed names exactly", () => {
    expect(breedHitsBanList("比特犬", bans)).toBe(true);
    expect(breedHitsBanList("柯基", bans)).toBe(false);
  });

  it("does not match aliases or partial names", () => {
    expect(breedHitsBanList("比特斗牛梗", bans)).toBe(false);
    expect(breedHitsBanList("比特", bans)).toBe(false);
    expect(breedHitsBanList("日本土佐犬", bans)).toBe(false);
  });

  it("short-circuits for empty breed, 「其他」 and missing profile", () => {
    expect(breedHitsBanList(null, bans)).toBe(false);
    expect(breedHitsBanList(undefined, bans)).toBe(false);
    expect(breedHitsBanList("", bans)).toBe(false);
    expect(breedHitsBanList("其他", bans)).toBe(false);
  });

  it("never hits an empty ban list", () => {
    expect(breedHitsBanList("比特犬", [])).toBe(false);
  });
});
describe("matchesCityPetPolicy", () => {
  const candidate = (overrides: Partial<DestinationCandidate> = {}): DestinationCandidate => ({
    adcode: "330100",
    name: "杭州市",
    province: "浙江省",
    policyCovered: false,
    bannedBreeds: [],
    allowedPetTypes: "CAT,DOG",
    allowedDogBreedIds: [],
    maxSinglePetShoulderHeightCm: null,
    ...overrides,
  });

  it("treats null allowedPetTypes as not allowed", () => {
    const unconfigured = candidate({ allowedPetTypes: null });
    expect(matchesCityPetPolicy(unconfigured, { petType: "DOG", breedId: 7, shoulderHeightCm: 40 })).toBe(false);
    expect(matchesCityPetPolicy(unconfigured, { petType: "CAT", breedId: null, shoulderHeightCm: null })).toBe(false);
  });

  it("matches only contained types", () => {
    const catOnly = candidate({ allowedPetTypes: "CAT" });
    expect(matchesCityPetPolicy(catOnly, { petType: "CAT", breedId: null, shoulderHeightCm: null })).toBe(true);
    expect(matchesCityPetPolicy(catOnly, { petType: "DOG", breedId: 7, shoulderHeightCm: null })).toBe(false);

    const both = candidate({ allowedPetTypes: "CAT,DOG" });
    expect(matchesCityPetPolicy(both, { petType: "DOG", breedId: 7, shoulderHeightCm: null })).toBe(true);
    expect(matchesCityPetPolicy(both, { petType: "CAT", breedId: null, shoulderHeightCm: null })).toBe(true);
  });

  it("treats an empty breed list as unconfigured", () => {
    expect(matchesCityPetPolicy(candidate(), { petType: "DOG", breedId: 7, shoulderHeightCm: null })).toBe(true);
  });

  it("requires the breed id in a non-empty list for dogs", () => {
    const restricted = candidate({ allowedDogBreedIds: [3, 7] });
    expect(matchesCityPetPolicy(restricted, { petType: "DOG", breedId: 7, shoulderHeightCm: null })).toBe(true);
    expect(matchesCityPetPolicy(restricted, { petType: "DOG", breedId: 9, shoulderHeightCm: null })).toBe(false);
  });

  it("skips the breed layer for cats and breedless dogs", () => {
    const restricted = candidate({ allowedDogBreedIds: [3] });
    expect(matchesCityPetPolicy(restricted, { petType: "CAT", breedId: null, shoulderHeightCm: null })).toBe(true);
    expect(matchesCityPetPolicy(restricted, { petType: "DOG", breedId: null, shoulderHeightCm: null })).toBe(true);
  });
});
