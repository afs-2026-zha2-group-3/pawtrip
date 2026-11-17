import { describe, expect, it } from "vitest";
import { formatDistanceKm } from "./distance";

describe("distance formatting", () => {
  it("formats meters as one-decimal kilometers", () => {
    expect(formatDistanceKm(0)).toBe("0.0km");
    expect(formatDistanceKm(56)).toBe("0.1km");
    expect(formatDistanceKm(560)).toBe("0.6km");
    expect(formatDistanceKm(2224)).toBe("2.2km");
    expect(formatDistanceKm(5000)).toBe("5.0km");
  });
});
