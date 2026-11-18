import { describe, expect, it } from "vitest";
import type { Pet } from "@/queries/pets";
import type { Trip } from "@/lib/trip/types";
import { buildAgentContext, buildSystemPrompt } from "./context";

const pet: Pet = {
  id: 1,
  name: "豆豆",
  petType: "DOG",
  weightKg: 5,
  shoulderHeightCm: 30,
  hasLeash: true,
  hasVaccinationProof: true,
  photo: null,
  dogBreed: null,
  preferences: ["SWIMMING", "HIKING"],
  personality: "ENERGETIC",
};

const trip: Trip = {
  id: 4,
  name: "珠海两日",
  cityAdcode: "440400",
  petId: 1,
  totalDays: 2,
  startDate: null,
  transportMode: null,
  plan: { version: 1, days: [], unscheduled: [] },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("agent planning context", () => {
  it("passes pet preferences, personality and city feature tags", () => {
    const context = buildAgentContext({
      active: trip,
      pets: [pet],
      city: {
        adcode: "440400",
        name: "珠海",
        province: "广东省",
        featureTags: ["COASTAL", "CITY_PARK"],
      },
    });

    expect(context.pet?.preferences).toEqual(["SWIMMING", "HIKING"]);
    expect(context.pet?.personality).toBe("ENERGETIC");
    expect(context.city?.featureTags).toEqual(["COASTAL", "CITY_PARK"]);
  });

  it("treats missing personalization data as unset", () => {
    const context = buildAgentContext({
      active: trip,
      pets: [{ ...pet, preferences: [], personality: null }],
      city: {
        adcode: "440400",
        name: "珠海",
        province: "广东省",
        featureTags: [],
      },
    });

    expect(context.pet?.preferences).toEqual([]);
    expect(context.pet?.personality).toBeNull();
    expect(context.city?.featureTags).toEqual([]);
  });

  it("keeps personalization as a soft signal in the system prompt", () => {
    const prompt = buildSystemPrompt(
      buildAgentContext({
        active: trip,
        pets: [pet],
        city: { adcode: "440400", name: "珠海", province: "广东省", featureTags: [] },
      }),
    );

    expect(prompt).toContain("宠物喜好、性格");
    expect(prompt).toContain("不得据此改写或推断宠物政策结论");
    expect(prompt).toContain("今日营业时间");
    expect(prompt).toContain("地点标签");
  });
});
