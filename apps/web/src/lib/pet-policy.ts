import type { PetPolicies } from "../queries/admin-locations";

export type PetPolicyTriState = "unset" | "required" | "not-required";

export interface PetPolicyDraft {
  maxPetsPerPerson: string;
  maxSinglePetWeightKg: string;
  leashRequired: PetPolicyTriState;
  vaccinationProofRequired: PetPolicyTriState;
  extraFeeYuan: string;
  reservationRequired: PetPolicyTriState;
}

export type PetPolicyField = keyof PetPolicyDraft;

export interface PetPolicyError {
  field: PetPolicyField;
  message: string;
}

export type PetPolicyParseResult =
  | { policies: PetPolicies }
  | { error: PetPolicyError };

export const emptyPetPolicyDraft: PetPolicyDraft = {
  maxPetsPerPerson: "",
  maxSinglePetWeightKg: "",
  leashRequired: "unset",
  vaccinationProofRequired: "unset",
  extraFeeYuan: "",
  reservationRequired: "unset",
};

const COUNT_MESSAGE = "每位游客最多携带宠物数必须为不小于 0 的整数。";
const WEIGHT_MESSAGE = "单只宠物最大体重必须为不小于 0 且最多两位小数的数字。";
const FEE_MESSAGE = "额外费用必须为不小于 0 且最多两位小数的金额。";

export function petPolicyDraftFrom(policies: PetPolicies | null | undefined): PetPolicyDraft {
  if (!policies) {
    return { ...emptyPetPolicyDraft };
  }
  return {
    maxPetsPerPerson: policies.maxPetsPerPerson === null ? "" : String(policies.maxPetsPerPerson),
    maxSinglePetWeightKg: policies.maxSinglePetWeightKg === null ? "" : String(policies.maxSinglePetWeightKg),
    leashRequired: triStateFromBoolean(policies.leashRequired),
    vaccinationProofRequired: triStateFromBoolean(policies.vaccinationProofRequired),
    extraFeeYuan: formatCentsAsYuan(policies.extraFeeCents),
    reservationRequired: triStateFromBoolean(policies.reservationRequired),
  };
}

export function petPoliciesFromDraft(draft: PetPolicyDraft): PetPolicyParseResult {
  const maxPetsPerPerson = parseInteger(draft.maxPetsPerPerson, "maxPetsPerPerson", COUNT_MESSAGE);
  if ("error" in maxPetsPerPerson) {
    return maxPetsPerPerson;
  }
  const maxSinglePetWeightKg = parseDecimal(
    draft.maxSinglePetWeightKg,
    "maxSinglePetWeightKg",
    WEIGHT_MESSAGE,
  );
  if ("error" in maxSinglePetWeightKg) {
    return maxSinglePetWeightKg;
  }
  const extraFeeCents = parseYuanToCents(draft.extraFeeYuan);
  if ("error" in extraFeeCents) {
    return extraFeeCents;
  }
  return {
    policies: {
      maxPetsPerPerson: maxPetsPerPerson.value,
      maxSinglePetWeightKg: maxSinglePetWeightKg.value,
      leashRequired: booleanFromTriState(draft.leashRequired),
      vaccinationProofRequired: booleanFromTriState(draft.vaccinationProofRequired),
      extraFeeCents: extraFeeCents.value,
      reservationRequired: booleanFromTriState(draft.reservationRequired),
    },
  };
}

export function formatCentsAsYuan(cents: number | null): string {
  if (cents === null) {
    return "";
  }
  const whole = Math.trunc(cents / 100);
  const fraction = cents % 100;
  if (fraction === 0) {
    return String(whole);
  }
  if (fraction % 10 === 0) {
    return `${whole}.${fraction / 10}`;
  }
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}

export function triStateFromBoolean(value: boolean | null): PetPolicyTriState {
  if (value === true) {
    return "required";
  }
  if (value === false) {
    return "not-required";
  }
  return "unset";
}

export function booleanFromTriState(value: PetPolicyTriState): boolean | null {
  if (value === "required") {
    return true;
  }
  if (value === "not-required") {
    return false;
  }
  return null;
}

type ParsedValue<T> = { value: T } | { error: PetPolicyError };

function parseInteger(value: string, field: PetPolicyField, message: string): ParsedValue<number | null> {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { error: { field, message } };
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    return { error: { field, message } };
  }
  return { value: parsed };
}

function parseDecimal(value: string, field: PetPolicyField, message: string): ParsedValue<number | null> {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return { error: { field, message } };
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { error: { field, message } };
  }
  return { value: parsed };
}

function parseYuanToCents(value: string): ParsedValue<number | null> {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return { error: { field: "extraFeeYuan", message: FEE_MESSAGE } };
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) {
    return { error: { field: "extraFeeYuan", message: FEE_MESSAGE } };
  }
  return { value: cents };
}
