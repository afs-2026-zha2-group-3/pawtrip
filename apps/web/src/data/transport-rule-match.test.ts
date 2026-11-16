import { describe, expect, it } from "vitest";
import { evaluateRuleForPet, type PetSnapshot } from "./transport-rule-match";
import { getRuleById } from "./transport-rules";

function rule(id: string) {
  const found = getRuleById(id);
  if (!found) {
    throw new Error(`规则不存在：${id}`);
  }
  return found;
}

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

describe("evaluateRuleForPet", () => {
  it("全部条件满足时推荐", () => {
    expect(evaluateRuleForPet(rule("high-speed-rail-isolated"), doudou)).toEqual({
      recommended: true,
      reasons: [],
    });
  });

  it("体重、肩高、检疫证明都不满足时按顺序列出全部原因", () => {
    expect(evaluateRuleForPet(rule("high-speed-rail-isolated"), maomao)).toEqual({
      recommended: false,
      reasons: ["体重 38kg 超过上限 15kg", "肩高 55cm 超过上限 40cm", "缺少动物检疫合格证明"],
    });
  });

  it("只缺检疫证明时只报缺证", () => {
    const heavyWithCert: PetSnapshot = { ...maomao, hasVaccinationProof: true };

    expect(evaluateRuleForPet(rule("drive-self"), heavyWithCert)).toEqual({
      recommended: true,
      reasons: [],
    });
    expect(evaluateRuleForPet(rule("drive-self"), maomao)).toEqual({
      recommended: false,
      reasons: ["缺少动物检疫合格证明"],
    });
  });

  it("无肩高上限的规则不参与肩高判定", () => {
    expect(evaluateRuleForPet(rule("flight-ca-checked"), { ...maomao, hasVaccinationProof: true })).toEqual({
      recommended: false,
      reasons: ["体重 38kg 超过上限 32kg"],
    });
  });

  it("恰好等于上限视为满足", () => {
    const edge: PetSnapshot = {
      name: "边界",
      weightKg: 15,
      shoulderHeightCm: 40,
      hasVaccinationProof: true,
    };

    expect(evaluateRuleForPet(rule("high-speed-rail-isolated"), edge).recommended).toBe(true);
  });

  it("规则不可携带时只给出不可携带一种原因", () => {
    const blocked = { ...rule("drive-self"), allowanceStatus: "not_allowed" as const };

    expect(evaluateRuleForPet(blocked, doudou)).toEqual({
      recommended: false,
      reasons: ["该方式不可携带宠物"],
    });
  });
});
