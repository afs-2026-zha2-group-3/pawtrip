import { describe, expect, it } from "vitest";
import { breedHitsBanList } from "./destination-matching";

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