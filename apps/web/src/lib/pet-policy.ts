import type { PetPolicies } from "../queries/admin-locations";

export type PetPolicyTriState = "unset" | "required" | "not-required";
export type AllowedPetTypesSelection = "unset" | "cat" | "dog" | "cat-dog";

export interface PetPolicyDraft {
  allowedPetTypes: AllowedPetTypesSelection;
  maxPetsPerPerson: string;
  maxSinglePetWeightKg: string;
  maxSinglePetShoulderHeightCm: string;
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
  allowedPetTypes: "unset",
  maxPetsPerPerson: "",
  maxSinglePetWeightKg: "",
  maxSinglePetShoulderHeightCm: "",
  leashRequired: "unset",
  vaccinationProofRequired: "unset",
  extraFeeYuan: "",
  reservationRequired: "unset",
};

const COUNT_MESSAGE = "每位游客最多携带宠物数必须为不小于 0 的整数。";
const WEIGHT_MESSAGE = "单只宠物最大体重必须为不小于 0 且最多两位小数的数字。";
const SHOULDER_HEIGHT_MESSAGE = "单只宠物最大肩高必须为不小于 0 且最多两位小数的数字。";
const FEE_MESSAGE = "额外费用必须为不小于 0 且最多两位小数的金额。";

export function petPolicyDraftFrom(policies: PetPolicies | null | undefined): PetPolicyDraft {
  if (!policies) {
    return { ...emptyPetPolicyDraft };
  }
  return {
    allowedPetTypes: allowedPetTypesSelectionFrom(policies.allowedPetTypes),
    maxPetsPerPerson: policies.maxPetsPerPerson === null ? "" : String(policies.maxPetsPerPerson),
    maxSinglePetWeightKg: policies.maxSinglePetWeightKg === null ? "" : String(policies.maxSinglePetWeightKg),
    maxSinglePetShoulderHeightCm: policies.maxSinglePetShoulderHeightCm == null
      ? ""
      : String(policies.maxSinglePetShoulderHeightCm),
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
  const maxSinglePetShoulderHeightCm = parseDecimal(
    draft.maxSinglePetShoulderHeightCm,
    "maxSinglePetShoulderHeightCm",
    SHOULDER_HEIGHT_MESSAGE,
  );
  if ("error" in maxSinglePetShoulderHeightCm) {
    return maxSinglePetShoulderHeightCm;
  }
  const extraFeeCents = parseYuanToCents(draft.extraFeeYuan);
  if ("error" in extraFeeCents) {
    return extraFeeCents;
  }
  return {
    policies: {
      allowedPetTypes: allowedPetTypesFromSelection(draft.allowedPetTypes),
      maxPetsPerPerson: maxPetsPerPerson.value,
      maxSinglePetWeightKg: maxSinglePetWeightKg.value,
      maxSinglePetShoulderHeightCm: maxSinglePetShoulderHeightCm.value,
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

export function allowedPetTypesSelectionFrom(value: string | null): AllowedPetTypesSelection {
  if (value === "CAT") {
    return "cat";
  }
  if (value === "DOG") {
    return "dog";
  }
  if (value === "CAT,DOG") {
    return "cat-dog";
  }
  return "unset";
}

export function allowedPetTypesFromSelection(value: AllowedPetTypesSelection): string | null {
  if (value === "cat") {
    return "CAT";
  }
  if (value === "dog") {
    return "DOG";
  }
  if (value === "cat-dog") {
    return "CAT,DOG";
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
