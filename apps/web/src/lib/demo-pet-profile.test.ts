import { describe, expect, it } from "vitest";
import { demoBreedFromSearch } from "./demo-pet-profile";

describe("demoBreedFromSearch", () => {
  it("returns the breed from the search", () => {
    expect(demoBreedFromSearch({ breed: "比特斗牛梗犬" })).toBe("比特斗牛梗犬");
  });

  it("returns null when no breed is provided", () => {
    expect(demoBreedFromSearch({})).toBeNull();
    expect(demoBreedFromSearch(undefined)).toBeNull();
    expect(demoBreedFromSearch({ breed: "" })).toBeNull();
    expect(demoBreedFromSearch({ breed: "  " })).toBeNull();
  });

  it("keeps 其他 as an explicit breed value", () => {
    expect(demoBreedFromSearch({ breed: "其他" })).toBe("其他");
  });

  it("trims surrounding whitespace", () => {
    expect(demoBreedFromSearch({ breed: " 柯基 " })).toBe("柯基");
  });
});
