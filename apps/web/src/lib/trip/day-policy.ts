import type { LocationBrowseDetail } from "@/queries/locations";
import type { TripStop } from "./types";

export interface DayPolicyPet {
  hasLeash: boolean | null;
  weightKg: number | null;
  shoulderHeightCm: number | null;
}

export interface DaySizeWarning {
  poiId: string;
  name: string;
  weightLimitKg: number | null;
  heightLimitCm: number | null;
}

export interface DayPolicyReminder {
  leash: "required" | "required-no-leash" | null;
  sizeWarnings: DaySizeWarning[];
}

export function deriveDayPolicy(
  stops: TripStop[],
  locations: Record<string, LocationBrowseDetail>,
  pet: DayPolicyPet | null,
): DayPolicyReminder {
  let leashRequired = false;
  const sizeWarnings: DaySizeWarning[] = [];
  const seen = new Set<string>();
  for (const stop of stops) {
    if (seen.has(stop.poiId)) continue;
    seen.add(stop.poiId);
    const detail = locations[stop.poiId];
    if (!detail) continue;
    const policies = detail.petPolicies;
    if (policies.leashRequired === true) leashRequired = true;
    const weightLimitKg =
      policies.maxSinglePetWeightKg != null &&
      pet?.weightKg != null &&
      pet.weightKg > policies.maxSinglePetWeightKg
        ? policies.maxSinglePetWeightKg
        : null;
    const heightLimitCm =
      policies.maxSinglePetShoulderHeightCm != null &&
      pet?.shoulderHeightCm != null &&
      pet.shoulderHeightCm > policies.maxSinglePetShoulderHeightCm
        ? policies.maxSinglePetShoulderHeightCm
        : null;
    if (weightLimitKg != null || heightLimitCm != null) {
      sizeWarnings.push({ poiId: stop.poiId, name: detail.name, weightLimitKg, heightLimitCm });
    }
  }
  const leash = leashRequired
    ? pet?.hasLeash === false
      ? "required-no-leash"
      : "required"
    : null;
  return { leash, sizeWarnings };
}

// 当天汇总行仅保留牵引绳提醒；体型超限警示改在对应景点行下方展示（2026-11-17 修订）
export function dayPolicyLines(reminder: DayPolicyReminder): string[] {
  const lines: string[] = [];
  if (reminder.leash === "required") {
    lines.push("当天需携带牵引绳");
  } else if (reminder.leash === "required-no-leash") {
    lines.push("当天需携带牵引绳（档案未登记牵引绳，请自备）");
  }
  return lines;
}

// 体型超限警示文案：点名宠物与景点、列出超限维度；宠物名缺失时退化为无名版本
export function sizeWarningLine(warning: DaySizeWarning, petName: string | null): string {
  const limits = [
    warning.weightLimitKg != null ? `≤${warning.weightLimitKg}kg` : null,
    warning.heightLimitCm != null ? `≤${warning.heightLimitCm}cm` : null,
  ]
    .filter((part) => part != null)
    .join("/");
  const subject = petName ? `您的宠物「${petName}」` : "您的宠物";
  return `${subject}超出景点 ${warning.name} 限制（${limits}）`;
}