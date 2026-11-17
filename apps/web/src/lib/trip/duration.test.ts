import { describe, expect, it } from "vitest";
import { daysBetween } from "./duration";

describe("daysBetween", () => {
  it("counts both the start and end day", () => {
    expect(daysBetween("2026-11-17", "2026-11-17")).toBe(1);
    expect(daysBetween("2026-11-17", "2026-11-19")).toBe(3);
    expect(daysBetween("2026-11-30", "2026-12-02")).toBe(3);
  });

  it("returns null when the end date is before the start date", () => {
    expect(daysBetween("2026-11-19", "2026-11-17")).toBeNull();
  });

  it("returns null for missing or invalid dates", () => {
    expect(daysBetween("", "2026-11-17")).toBeNull();
    expect(daysBetween("2026-11-17", "")).toBeNull();
    expect(daysBetween("2026/11/17", "2026-11-19")).toBeNull();
  });
});
