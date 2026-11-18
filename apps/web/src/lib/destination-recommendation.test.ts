import { describe, expect, it } from "vitest";
import type { DestinationCandidate } from "./destination-matching";
import { scoreCity, sortByRecommendation } from "./destination-recommendation";

function candidate(
  name: string,
  featureTags: string[],
): DestinationCandidate {
  return {
    adcode: name,
    name,
    province: "测试省",
    policyCovered: false,
    bannedBreeds: [],
    allowedPetTypes: "DOG",
    allowedDogBreedIds: [],
    maxSinglePetShoulderHeightCm: null,
    featureTags,
  };
}

describe("scoreCity", () => {
  it("scores each deduplicated preferred feature twice", () => {
    expect(scoreCity(["COASTAL", "LAKE", "MOUNTAIN"], ["SWIMMING"], null)).toBe(4);
    expect(scoreCity(["COASTAL"], ["SWIMMING", "SWIMMING"], null)).toBe(2);
  });

  it("adds one bonus when any personality feature matches", () => {
    expect(scoreCity(["LAKE"], [], "CALM")).toBe(1);
    expect(scoreCity(["CITY_PARK"], [], "TIMID")).toBe(1);
    expect(scoreCity(["COASTAL", "LAKE"], ["SWIMMING"], "CALM")).toBe(5);
  });

  it("returns zero for no matches, unknown tags or no preferences", () => {
    expect(scoreCity(["MOUNTAIN"], ["SWIMMING"], null)).toBe(0);
    expect(scoreCity([], ["SWIMMING"], "CALM")).toBe(0);
    expect(scoreCity(["UNKNOWN"], [], null)).toBe(0);
  });
});

describe("sortByRecommendation", () => {
  const coastal = candidate("A", ["COASTAL"]);
  const lakeAndPark = candidate("B", ["LAKE", "CITY_PARK"]);
  const plain = candidate("C", ["MOUNTAIN"]);

  it("returns the input order when the profile is null or empty", () => {
    const input = [plain, coastal, lakeAndPark];
    expect(sortByRecommendation(input, null)).toEqual(input);
    expect(sortByRecommendation(input, { preferences: [], personality: null })).toEqual(
      input,
    );
  });

  it("sorts by descending score and keeps input order for ties", () => {
    const anotherCoastal = candidate("D", ["COASTAL"]);
    expect(
      sortByRecommendation([plain, coastal, lakeAndPark, anotherCoastal], {
        preferences: ["SWIMMING"],
        personality: "CALM",
      }).map((entry) => entry.name),
    ).toEqual(["B", "A", "D", "C"]);
  });

  it("returns a new array without mutating the input", () => {
    const input = [plain, coastal];
    const sorted = sortByRecommendation(input, {
      preferences: ["SWIMMING"],
      personality: null,
    });
    expect(sorted).not.toBe(input);
    expect(input.map((entry) => entry.name)).toEqual(["C", "A"]);
  });
});
