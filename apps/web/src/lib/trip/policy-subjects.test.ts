import { describe, expect, it } from "vitest";
import type { Pet } from "@/queries/pets";
import { resolvePolicySubjects } from "./policy-subjects";
import type { Trip } from "./types";

const pet = (id: number, name: string): Pet => ({
  id,
  name,
  petType: "DOG",
  weightKg: 10,
  shoulderHeightCm: 40,
  hasLeash: true,
  hasVaccinationProof: true,
  photo: null,
  dogBreed: null,
  preferences: [],
  personality: null,
});

const activeTrip = (petId: number): Trip => ({
  id: 1,
  name: "杭州 · 2天 · 旺财",
  cityAdcode: "330100",
  petId,
  totalDays: 2,
  startDate: null,
  transportMode: null,
  planCompleted: false,
  plan: { version: 1, days: [], unscheduled: [] },
  createdAt: "2026-11-16T00:00:00Z",
  updatedAt: "2026-11-16T00:00:00Z",
});

const pets = [pet(1, "旺财"), pet(2, "小白")];

describe("policy subjects", () => {
  it("uses only the active pet when a trip is active", () => {
    const result = resolvePolicySubjects(activeTrip(2), pets, "ready");
    expect(result).toEqual({ status: "ready", subjects: [pets[1]] });
  });

  it("uses every pet when no trip is active", () => {
    const result = resolvePolicySubjects(null, pets, "ready");
    expect(result).toEqual({ status: "ready", subjects: pets });
  });

  it("reports loading while the active pet is not cached", () => {
    expect(resolvePolicySubjects(activeTrip(9), pets, "ready")).toEqual({
      status: "loading",
      subjects: [],
    });
  });

  it("reports loading before pets arrive without falling back", () => {
    expect(resolvePolicySubjects(activeTrip(1), [], "loading").status).toBe("loading");
  });

  it("reports failure instead of an empty pet list", () => {
    expect(resolvePolicySubjects(activeTrip(1), [], "error")).toEqual({
      status: "error",
      subjects: [],
    });
  });

  it("reports none when the user has no pets", () => {
    expect(resolvePolicySubjects(null, [], "ready")).toEqual({
      status: "none",
      subjects: [],
    });
  });
});
