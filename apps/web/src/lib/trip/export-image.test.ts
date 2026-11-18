// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { exportImageFilter, imageFileName } from "./export-image";

describe("imageFileName", () => {
  it("sanitizes the trip name", () => {
    expect(imageFileName("珠海 · 2天 · 豆豆")).toBe("珠海-2天-豆豆-行程单.png");
    expect(imageFileName("A/B:C*?")).toBe("A-B-C-行程单.png");
  });

  it("falls back when the trip name is empty", () => {
    expect(imageFileName("   ")).toBe("行程单-行程单.png");
  });
});

describe("exportImageFilter", () => {
  it("excludes nodes marked data-export-hidden and keeps others", () => {
    const hidden = document.createElement("button");
    hidden.setAttribute("data-export-hidden", "");
    const visible = document.createElement("p");

    expect(exportImageFilter(hidden)).toBe(false);
    expect(exportImageFilter(visible)).toBe(true);
  });
});
