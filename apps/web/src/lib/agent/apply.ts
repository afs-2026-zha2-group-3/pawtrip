import { ApiError } from "@/lib/http/api-error";
import type { Trip, TripPlan } from "@/lib/trip/types";
import type { TripSaveOutcome } from "@/lib/trip/save";
import type { AgentProposal } from "./types";

export type ApplyFailureReason =
  | "not_found"
  | "stale"
  | "not_active"
  | "save_failed"
  | "validation"
  | "invalid_location"
  | "unexpected";

export type ApplyResult =
  | { ok: true }
  | { ok: false; reason: ApplyFailureReason; message: string };

export interface ApplyProposalDeps {
  activeTripId: number | null;
  fetchTrip: (tripId: number) => Promise<Trip>;
  flushSave: () => Promise<TripSaveOutcome>;
  replaceActivePlan: (plan: TripPlan) => void;
  verifyPoiId: (poiId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export async function applyProposal(
  proposal: AgentProposal,
  deps: ApplyProposalDeps,
): Promise<ApplyResult> {
  if (deps.activeTripId !== proposal.tripId) {
    return fail("not_active", "目标行程已不是当前激活行程，请重新生成方案。");
  }

  let detail: Trip;
  try {
    detail = await deps.fetchTrip(proposal.tripId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return fail("not_found", "目标行程已不存在，无法应用方案。");
    }
    return fail("unexpected", "读取目标行程失败，请稍后重试。");
  }

  if (detail.updatedAt !== proposal.baseUpdatedAt) {
    return fail("stale", "目标行程在预览后已发生变化，请重新生成方案后再应用。");
  }

  const poiIds = collectPoiIds(proposal.plan);
  for (const poiId of poiIds) {
    const exists = await deps.verifyPoiId(poiId);
    if (!exists) {
      return fail("invalid_location", `方案引用的地点 ${poiId} 已不存在，方案未应用。`);
    }
  }

  const pending = await deps.flushSave();
  if (!pending.ok) {
    return fail("save_failed", "当前行程的自动保存失败，方案未应用。");
  }
  deps.replaceActivePlan(proposal.plan);
  const saved = await deps.flushSave();
  if (!saved.ok) {
    if (saved.status === 400) {
      return fail("validation", "服务端校验未通过，方案未生效。");
    }
    return fail("save_failed", "保存方案失败，请稍后重试。");
  }
  await deps.refresh();
  return { ok: true };
}

function collectPoiIds(plan: TripPlan): string[] {
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

function fail(reason: ApplyFailureReason, message: string): ApplyResult {
  return { ok: false, reason, message };
}
