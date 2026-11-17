import { evaluateRuleForPet, type PetSnapshot, type PetRuleVerdict } from "./transport-rule-match";
import {
  getRuleForMode,
  transportModeLabels,
  transportRuleRowModes,
  type TransportMode,
} from "./transport-rules";

export interface TransportModeOption {
  mode: TransportMode;
  label: string;
  /** 飞机按默认航司的代表规则判定；其他方式为唯一代表规则 */
  carrierName: string | null;
  verdict: PetRuleVerdict | null;
}

/** 面板选择器与规则页共用同一判定：有行程宠物时按该宠物，否则不给结论 */
export function transportModeOptions(
  pet: PetSnapshot | null,
): TransportModeOption[] {
  return transportRuleRowModes.map((mode) => {
    const rule = getRuleForMode(mode);
    return {
      mode,
      label: transportModeLabels[mode],
      carrierName: mode === "flight" ? (rule?.carrierName ?? null) : null,
      verdict: pet && rule ? evaluateRuleForPet(rule, pet) : null,
    };
  });
}
