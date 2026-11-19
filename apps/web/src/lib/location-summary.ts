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

export const LOCATION_TYPES = ["attraction", "hotel", "restaurant"] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export function normalizeLocationType(value: unknown): LocationType {
  return value === "hotel" || value === "restaurant" ? value : "attraction";
}

export function locationDescription(location: {
  description?: string | null;
  address?: string | null;
}): string {
  const description = location.description?.trim();
  if (description) {
    return description;
  }
  const address = location.address?.trim();
  return address ? address : "地址未收录";
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