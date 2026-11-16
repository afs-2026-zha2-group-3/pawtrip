import { describe, expect, it } from "vitest";
import {
  breedHitsBanList,
  isPetFriendlyDestination,
  matchesDestinationKeyword,
  type DestinationCandidate,
} from "./destination-matching";

function candidate(overrides: Partial<DestinationCandidate> = {}): DestinationCandidate {
  return {
    adcode: "330100",
    name: "杭州市",
    province: "浙江省",
    policyCovered: true,
    bannedBreeds: [
      { breedName: "比特犬", source: "s", updated: "2007-08-13" },
      { breedName: "日本土佐", source: "s", updated: "2007-08-13" },
    ],
    ...overrides,
  };
}

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

describe("isPetFriendlyDestination", () => {
  it("requires policy coverage", () => {
    expect(isPetFriendlyDestination(candidate({ policyCovered: false }), "柯基")).toBe(false);
    expect(isPetFriendlyDestination(candidate({ policyCovered: false }), null)).toBe(false);
  });

  it("excludes cities whose ban list hits the profile breed", () => {
    expect(isPetFriendlyDestination(candidate(), "比特犬")).toBe(false);
    expect(isPetFriendlyDestination(candidate(), "柯基")).toBe(true);
  });

  it("degrades to covered-only without a usable breed", () => {
    expect(isPetFriendlyDestination(candidate(), null)).toBe(true);
    expect(isPetFriendlyDestination(candidate(), "")).toBe(true);
    expect(isPetFriendlyDestination(candidate(), "其他")).toBe(true);
  });
});

describe("matchesDestinationKeyword", () => {
  it("matches city name and province by keyword", () => {
    expect(matchesDestinationKeyword(candidate(), "杭州")).toBe(true);
    expect(matchesDestinationKeyword(candidate(), "浙江")).toBe(true);
    expect(matchesDestinationKeyword(candidate(), "广东")).toBe(false);
  });

  it("trims the keyword and treats empty as match-all", () => {
    expect(matchesDestinationKeyword(candidate(), "  杭州 ")).toBe(true);
    expect(matchesDestinationKeyword(candidate(), "")).toBe(true);
    expect(matchesDestinationKeyword(candidate(), "   ")).toBe(true);
  });
});