import { normalizePlan } from "@/lib/trip/plan";
import type { TripPlan } from "@/lib/trip/types";
import type { UpdateTripPlanInput } from "./types";

const TO_NEXT_VALUES = new Set(["walk", "drive", "transit"]);

export interface PlanEditValidationOptions {
  tripId: number;
  totalDays: number;
  allowedPoiIds: ReadonlySet<string>;
}

export type PlanEditValidation =
  | { ok: true; plan: TripPlan; summary: string; warnings: string[] }
  | { ok: false; error: string };

export function validatePlanEdits(
  input: unknown,
  current: TripPlan,
  options: PlanEditValidationOptions,
): PlanEditValidation {
  const edit = input as Partial<UpdateTripPlanInput> | null;
  if (!edit || typeof edit !== "object") {
    return fail("方案格式无效。");
  }
  if (edit.targetTripId !== options.tripId) {
    return fail("方案目标与当前激活行程不一致。");
  }
  if (typeof edit.summary !== "string" || edit.summary.trim() === "") {
    return fail("方案缺少摘要。");
  }
  if (!Array.isArray(edit.operations) || edit.operations.length === 0) {
    return fail("方案缺少修改操作。");
  }
  if (edit.operations.length > 30) {
    return fail("单次方案修改操作过多。");
  }
  const warnings = Array.isArray(edit.warnings)
    ? edit.warnings.filter((warning): warning is string => typeof warning === "string")
    : [];
  const knownPoiIds = new Set([...options.allowedPoiIds, ...collectPlanPoiIds(current)]);

  let plan = current;
  for (const raw of edit.operations) {
    const operation = raw as Record<string, unknown> | null;
    if (!operation || typeof operation !== "object") {
      return fail("方案包含无效操作。");
    }
    const poiId = typeof operation.poiId === "string" ? operation.poiId.trim() : "";
    if (!poiId) {
      return fail("方案操作缺少地点。");
    }

    if (operation.op === "add_stop") {
      if (!knownPoiIds.has(poiId)) {
        return fail(`方案引用了未查询到的地点：${poiId}。`);
      }
      const day = operation.day;
      if (!isInteger(day) || day < 1 || day > options.totalDays) {
        return fail(`添加地点的天数超出 1–${options.totalDays} 天。`);
      }
      const days = withDay(plan.days, day);
      const stops = days.find((entry) => entry.day === day)?.stops ?? [];
      const position = operation.position == null ? stops.length : operation.position;
      if (!isInteger(position) || position < 0 || position > stops.length) {
        return fail("添加地点的插入位置无效。");
      }
      const toNext = normalizeToNext(operation.toNext);
      if (toNext === false) {
        return fail("方案包含不支持的交通方式。");
      }
      const stop = toNext ? { poiId, toNext } : { poiId };
      const nextStops = [...stops];
      nextStops.splice(position, 0, stop);
      plan = {
        ...plan,
        days: days.map((entry) =>
          entry.day === day ? { ...entry, stops: nextStops } : entry,
        ),
        unscheduled: plan.unscheduled.filter((stop) => stop.poiId !== poiId),
      };
      continue;
    }

    if (operation.op === "remove_stop") {
      const day = operation.day;
      if (day != null && (!isInteger(day) || day < 1 || day > options.totalDays)) {
        return fail(`移除地点的天数超出 1–${options.totalDays} 天。`);
      }
      const matchedDays =
        day == null
          ? plan.days.filter((entry) => entry.stops.some((stop) => stop.poiId === poiId))
          : plan.days.filter(
              (entry) => entry.day === day && entry.stops.some((stop) => stop.poiId === poiId),
            );
      if (matchedDays.length === 0) {
        return fail(day == null ? `行程中不存在地点：${poiId}。` : `第 ${day} 天没有地点：${poiId}。`);
      }
      if (matchedDays.length > 1) {
        return fail(`地点 ${poiId} 出现在多天，请指定要移除的天数。`);
      }
      const targetDay = matchedDays[0].day;
      plan = {
        ...plan,
        days: plan.days.map((entry) =>
          entry.day === targetDay
            ? { ...entry, stops: entry.stops.filter((stop) => stop.poiId !== poiId) }
            : entry,
        ),
      };
      continue;
    }

    if (operation.op === "add_unscheduled") {
      if (!knownPoiIds.has(poiId)) {
        return fail(`方案引用了未查询到的地点：${poiId}。`);
      }
      if (isScheduled(plan, poiId)) {
        return fail(`地点 ${poiId} 已在行程中，不能重复加入未排期。`);
      }
      if (!plan.unscheduled.some((stop) => stop.poiId === poiId)) {
        plan = { ...plan, unscheduled: [...plan.unscheduled, { poiId }] };
      }
      continue;
    }

    if (operation.op === "remove_unscheduled") {
      if (!plan.unscheduled.some((stop) => stop.poiId === poiId)) {
        return fail(`未排期列表中不存在地点：${poiId}。`);
      }
      plan = {
        ...plan,
        unscheduled: plan.unscheduled.filter((stop) => stop.poiId !== poiId),
      };
      continue;
    }

    return fail("方案包含不支持的修改操作。");
  }

  return {
    ok: true,
    plan: normalizePlan(plan, options.totalDays),
    summary: edit.summary.trim(),
    warnings,
  };
}

function normalizeToNext(value: unknown): string | null | false {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !TO_NEXT_VALUES.has(value)) return false;
  return value;
}

function collectPlanPoiIds(plan: TripPlan): string[] {
  const ids = new Set<string>();
  for (const day of plan.days) {
    for (const stop of day.stops) {
      ids.add(stop.poiId);
    }
  }
  for (const stop of plan.unscheduled) {
    ids.add(stop.poiId);
  }
  return [...ids];
}

function withDay(days: TripPlan["days"], day: number): TripPlan["days"] {
  if (days.some((entry) => entry.day === day)) {
    return days;
  }
  return [...days, { day, stops: [] }].sort((a, b) => a.day - b.day);
}

function isScheduled(plan: TripPlan, poiId: string): boolean {
  return plan.days.some((day) => day.stops.some((stop) => stop.poiId === poiId));
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function fail(error: string): PlanEditValidation {
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
