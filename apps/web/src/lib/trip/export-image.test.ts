import { describe, expect, it } from "vitest";
import { imageFileName } from "./export-image";

describe("imageFileName", () => {
  it("sanitizes the trip name", () => {
    expect(imageFileName("珠海 · 2天 · 豆豆")).toBe("珠海-2天-豆豆-行程单.png");
    expect(imageFileName("A/B:C*?")).toBe("A-B-C-行程单.png");
  });

  it("falls back when the trip name is empty", () => {
    expect(imageFileName("   ")).toBe("行程单-行程单.png");
  });
});
