import { describe, expect, it } from "vitest";
import { transportModeOptions } from "./transport-mode-options";
import type { PetSnapshot } from "./transport-rule-match";

const doudou: PetSnapshot = {
  name: "豆豆",
  weightKg: 4.5,
  shoulderHeightCm: 25,
  hasVaccinationProof: true,
};

const maomao: PetSnapshot = {
  name: "毛毛",
  weightKg: 38,
  shoulderHeightCm: 55,
  hasVaccinationProof: false,
};

describe("transportModeOptions", () => {
  it("无宠物时列出四种方式但不给推荐结论", () => {
    const options = transportModeOptions(null);

    expect(options.map((option) => option.mode)).toEqual([
      "flight",
      "high_speed_rail",
      "train",
      "drive",
    ]);
    expect(options.every((option) => option.verdict === null)).toBe(true);
    expect(options[0].carrierName).toBe("中国国际航空");
  });

  it("按宠物档案给出每种方式的推荐结论与原因", () => {
    const options = transportModeOptions(maomao);
    const rail = options.find((option) => option.mode === "high_speed_rail");
    const drive = options.find((option) => option.mode === "drive");
    const flight = options.find((option) => option.mode === "flight");

    expect(rail?.verdict).toEqual({
      recommended: false,
      reasons: [
        "体重 38kg 超过上限 15kg",
        "肩高 55cm 超过上限 40cm",
        "缺少动物检疫合格证明",
      ],
    });
    expect(drive?.verdict).toEqual({
      recommended: false,
      reasons: ["缺少动物检疫合格证明"],
    });
    expect(flight?.carrierName).toBe("中国国际航空");
  });

  it("条件满足时标记为推荐", () => {
    const options = transportModeOptions(doudou);

    expect(options.every((option) => option.verdict?.recommended === true)).toBe(
      true,
    );
  });
});
