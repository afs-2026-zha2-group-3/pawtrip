import type { PetPolicies } from "../queries/locations";

export function policyNoteParts(policies: PetPolicies): string[] {
  const parts: string[] = [];
  if (policies.leashRequired === true) {
    parts.push("公共区域需牵引");
  }
  if (policies.vaccinationProofRequired === true) {
    parts.push("需疫苗证明");
  }
  if (policies.reservationRequired === true) {
    parts.push("需提前预约");
  }
  return parts;
}

export function displayRating(rating: string | null): string | null {
  if (rating === null) {
    return null;
  }
  const trimmed = rating.trim();
  if (trimmed === "" || !Number.isFinite(Number(trimmed))) {
    return null;
  }
  return trimmed;
}