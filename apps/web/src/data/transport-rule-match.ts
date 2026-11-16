// 宠物档案与交通规则的对比判定：纯函数，规则来自 transport-rules.ts 常量。
// 判定口径见 openspec/changes/add-rule-recommendation-and-selection/design.md（D2）。
import type { TransportRule } from "./transport-rules";

/** 判定只需要档案中的这几个字段；PetProfile 结构兼容即可传入 */
export interface PetSnapshot {
  name: string;
  weightKg: number;
  shoulderHeightCm: number;
  hasVaccinationProof: boolean;
}

export interface PetRuleVerdict {
  recommended: boolean;
  /** 全部不满足原因，按体重、肩高、检疫证明的顺序排列 */
  reasons: string[];
}

/**
 * 按一条规则判定一只宠物是否被推荐。
 * 阈值为空表示该维度无限制；检疫证明为硬条件；规则状态为「不可」时直接不推荐。
 */
export function evaluateRuleForPet(rule: TransportRule, pet: PetSnapshot): PetRuleVerdict {
  if (rule.allowanceStatus === "not_allowed") {
    return { recommended: false, reasons: ["该方式不可携带宠物"] };
  }

  const reasons: string[] = [];

  if (rule.weightLimitKg !== null && pet.weightKg > rule.weightLimitKg) {
    reasons.push(`体重 ${pet.weightKg}kg 超过上限 ${rule.weightLimitKg}kg`);
  }

  if (rule.shoulderLimitCm !== null && pet.shoulderHeightCm > rule.shoulderLimitCm) {
    reasons.push(`肩高 ${pet.shoulderHeightCm}cm 超过上限 ${rule.shoulderLimitCm}cm`);
  }

  if (!pet.hasVaccinationProof) {
    reasons.push("缺少动物检疫合格证明");
  }

  return { recommended: reasons.length === 0, reasons };
}
