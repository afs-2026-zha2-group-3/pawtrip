import { normalizePlan } from "@/lib/trip/plan";
import type { TripPlan } from "@/lib/trip/types";
import type { ProposeTripPlanInput } from "./types";

const TO_NEXT_VALUES = new Set(["walk", "drive", "transit"]);

export interface ProposalValidationOptions {
  tripId: number;
  totalDays: number;
  allowedPoiIds: ReadonlySet<string>;
}

export type ProposalValidation =
  | { ok: true; plan: TripPlan; summary: string; warnings: string[] }
  | { ok: false; error: string };

export function validateProposal(
  input: unknown,
  options: ProposalValidationOptions,
): ProposalValidation {
  const proposal = input as Partial<ProposeTripPlanInput> | null;
  if (!proposal || typeof proposal !== "object") {
    return fail("方案格式无效。");
  }
  const target = proposal.target as { kind?: unknown; tripId?: unknown } | undefined;
  if (!target || target.kind !== "existing" || target.tripId !== options.tripId) {
    return fail("方案目标与当前规划目标不一致。");
  }
  if (typeof proposal.summary !== "string" || proposal.summary.trim() === "") {
    return fail("方案缺少摘要。");
  }
  const warnings = Array.isArray(proposal.warnings)
    ? proposal.warnings.filter((warning): warning is string => typeof warning === "string")
    : [];
  const plan = proposal.plan;
  if (!plan || typeof plan !== "object" || plan.version !== 1) {
    return fail("方案计划格式无效。");
  }
  if (!Array.isArray(plan.days)) {
    return fail("方案缺少按天安排。");
  }

  const seenDays = new Set<number>();
  for (const day of plan.days) {
    if (!day || typeof day.day !== "number" || !Number.isInteger(day.day)) {
      return fail("方案中的天数无效。");
    }
    if (day.day < 1 || day.day > options.totalDays) {
      return fail(`方案包含超出 ${options.totalDays} 天的安排。`);
    }
    if (seenDays.has(day.day)) {
      return fail("方案包含重复的天数。");
    }
    seenDays.add(day.day);
    if (!Array.isArray(day.stops)) {
      return fail("方案中的地点列表无效。");
    }
    for (const stop of day.stops) {
      if (!stop || typeof stop.poiId !== "string" || stop.poiId.trim() === "") {
        return fail("方案包含无效地点。");
      }
      if (!options.allowedPoiIds.has(stop.poiId)) {
        return fail(`方案引用了未查询到的地点：${stop.poiId}。`);
      }
      if (
        stop.toNext != null &&
        stop.toNext !== "" &&
        !TO_NEXT_VALUES.has(stop.toNext)
      ) {
        return fail("方案包含不支持的交通方式。");
      }
    }
  }

  if (plan.unscheduled != null && !Array.isArray(plan.unscheduled)) {
    return fail("方案中的未排期地点无效。");
  }
  for (const stop of plan.unscheduled ?? []) {
    if (!stop || typeof stop.poiId !== "string" || stop.poiId.trim() === "") {
      return fail("方案包含无效的未排期地点。");
    }
    if (!options.allowedPoiIds.has(stop.poiId)) {
      return fail(`方案引用了未查询到的地点：${stop.poiId}。`);
    }
  }

  return {
    ok: true,
    plan: normalizePlan(
      {
        version: 1,
        days: plan.days.map((day) => ({
          day: day.day,
          stops: day.stops.map((stop) => ({
            poiId: stop.poiId,
            ...(stop.toNext == null || stop.toNext === "" ? {} : { toNext: stop.toNext }),
          })),
        })),
        unscheduled: (plan.unscheduled ?? []).map((stop) => ({ poiId: stop.poiId })),
      },
      options.totalDays,
    ),
    summary: proposal.summary.trim(),
    warnings,
  };
}

function fail(error: string): ProposalValidation {
  return { ok: false, error };
}

export interface PlanDiffDay {
  day: number;
  added: string[];
  removed: string[];
  kept: string[];
}

export interface PlanDiff {
  days: PlanDiffDay[];
  unscheduledAdded: string[];
  unscheduledRemoved: string[];
}

export function diffPlans(current: TripPlan, next: TripPlan, totalDays: number): PlanDiff {
  const days: PlanDiffDay[] = [];
  for (let day = 1; day <= totalDays; day += 1) {
    const currentIds =
      current.days.find((entry) => entry.day === day)?.stops.map((stop) => stop.poiId) ?? [];
    const nextIds =
      next.days.find((entry) => entry.day === day)?.stops.map((stop) => stop.poiId) ?? [];
    const currentSet = new Set(currentIds);
    const nextSet = new Set(nextIds);
    days.push({
      day,
      added: nextIds.filter((poiId) => !currentSet.has(poiId)),
      removed: currentIds.filter((poiId) => !nextSet.has(poiId)),
      kept: nextIds.filter((poiId) => currentSet.has(poiId)),
    });
  }
  const currentUnscheduled = new Set(current.unscheduled.map((stop) => stop.poiId));
  const nextUnscheduled = new Set(next.unscheduled.map((stop) => stop.poiId));
  return {
    days,
    unscheduledAdded: [...nextUnscheduled].filter((poiId) => !currentUnscheduled.has(poiId)),
    unscheduledRemoved: [...currentUnscheduled].filter((poiId) => !nextUnscheduled.has(poiId)),
  };
}
