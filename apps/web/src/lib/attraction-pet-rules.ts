import { formatCentsAsYuan } from "./pet-policy";

export type PetFriendlyStatus = "friendly" | "forbidden" | "unconfigured";

export interface AttractionPetPolicies {
  allowedPetTypes: string | null;
  maxPetsPerPerson: number | null;
  maxSinglePetWeightKg: number | null;
  maxSinglePetShoulderHeightCm: number | null;
  leashRequired: boolean | null;
  vaccinationProofRequired: boolean | null;
  extraFeeCents: number | null;
  reservationRequired: boolean | null;
}

export interface PetPolicyField {
  label: string;
  value: string;
}

const PET_FRIENDLY_LABELS: Record<PetFriendlyStatus, string> = {
  friendly: "宠物友好",
  forbidden: "禁止携带",
  unconfigured: "未配置",
};

const ALLOWED_PET_TYPE_LABELS: Record<string, string> = {
  CAT: "猫",
  DOG: "狗",
  "CAT,DOG": "猫和狗",
};

const PET_RULE_EXEMPT_TYPE_GROUPS = new Set(["pet-hospital", "pet-supplies"]);

export function petRulesApplyTo(typeGroup: string): boolean {
  return !PET_RULE_EXEMPT_TYPE_GROUPS.has(typeGroup);
}

export function petFriendlyStatus(maxPetsPerPerson: number | null): PetFriendlyStatus {
  if (maxPetsPerPerson === null) {
    return "unconfigured";
  }
  return maxPetsPerPerson >= 1 ? "friendly" : "forbidden";
}

export function petFriendlyLabel(maxPetsPerPerson: number | null): string {
  return PET_FRIENDLY_LABELS[petFriendlyStatus(maxPetsPerPerson)];
}

export function isPetPolicyConfigured(policies: AttractionPetPolicies): boolean {
  return (
    policies.allowedPetTypes != null ||
    policies.maxPetsPerPerson != null ||
    policies.maxSinglePetWeightKg != null ||
    policies.maxSinglePetShoulderHeightCm != null ||
    policies.leashRequired != null ||
    policies.vaccinationProofRequired != null
  );
}

export function formatAllowedPetTypes(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return ALLOWED_PET_TYPE_LABELS[value] ?? value;
}

export function formatBooleanRequirement(value: boolean | null): string | null {
  if (value === null) {
    return null;
  }
  return value ? "需要" : "不需要";
}

export function formatFee(cents: number | null): string | null {
  if (cents === null) {
    return null;
  }
  return `${formatCentsAsYuan(cents)} 元 / 只 / 次`;
}

export function petPolicyFields(policies: AttractionPetPolicies): PetPolicyField[] {
  const fields: PetPolicyField[] = [];
  const allowedPetTypes = formatAllowedPetTypes(policies.allowedPetTypes);
  if (allowedPetTypes !== null) {
    fields.push({ label: "允许宠物类型", value: allowedPetTypes });
  }
  if (policies.maxPetsPerPerson !== null) {
    fields.push({ label: "每位游客最多携带", value: `${policies.maxPetsPerPerson} 只 / 人` });
  }
  if (policies.maxSinglePetWeightKg !== null) {
    fields.push({ label: "单只宠物最大体重", value: `${policies.maxSinglePetWeightKg} kg` });
  }
  if (policies.maxSinglePetShoulderHeightCm !== null) {
    fields.push({ label: "单只宠物最大肩高", value: `${policies.maxSinglePetShoulderHeightCm} cm` });
  }
  const leashRequired = formatBooleanRequirement(policies.leashRequired);
  if (leashRequired !== null) {
    fields.push({ label: "牵引绳要求", value: leashRequired });
  }
  const vaccinationProofRequired = formatBooleanRequirement(policies.vaccinationProofRequired);
  if (vaccinationProofRequired !== null) {
    fields.push({ label: "疫苗证明要求", value: vaccinationProofRequired });
  }
  const extraFee = formatFee(policies.extraFeeCents);
  if (extraFee !== null) {
    fields.push({ label: "额外费用", value: extraFee });
  }
  const reservationRequired = formatBooleanRequirement(policies.reservationRequired);
  if (reservationRequired !== null) {
    fields.push({ label: "预约要求", value: reservationRequired });
  }
  return fields;
}

export function hasPetPolicyFields(policies: AttractionPetPolicies): boolean {
  return petPolicyFields(policies).length > 0;
}
