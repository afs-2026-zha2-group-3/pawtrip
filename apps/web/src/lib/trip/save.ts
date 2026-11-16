import { ApiError } from "@/lib/http/api-error";
import { request } from "@/lib/http/request";
import { updateTrip } from "@/queries/trips";
import { normalizePlan } from "./plan";
import { tripActions, tripStore } from "./store";
import type { Trip } from "./types";

const SAVE_DELAY_MS = 600;

let timer: ReturnType<typeof setTimeout> | null = null;
let requestVersion = 0;

export function scheduleTripSave(delay = SAVE_DELAY_MS): void {
  if (timer) {
    clearTimeout(timer);
  }
  if (!tripStore.state.active) {
    return;
  }
  tripActions.setSaveStatus("saving");
  timer = setTimeout(() => {
    timer = null;
    void flushTripSave();
  }, delay);
}

export function cancelScheduledTripSave(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export async function flushTripSave(): Promise<void> {
  const state = tripStore.state;
  const active = state.active;
  if (!active) {
    return;
  }
  const plan = normalizePlan(active.plan, active.totalDays);
  if (plan !== active.plan) {
    tripActions.setPlan(plan);
  }
  const revisionAtStart = state.saveRevision;
  const version = ++requestVersion;
  tripActions.setSaveStatus("saving");
  try {
    const updated = await updateTrip(active.id, {
      name: active.name,
      totalDays: active.totalDays,
      plan,
    });
    if (version !== requestVersion) {
      return;
    }
    if (tripStore.state.saveRevision === revisionAtStart) {
      tripActions.setActive(updated);
    }
    if (!timer) {
      tripActions.setSaveStatus("saved");
    }
  } catch (error) {
    if (version !== requestVersion) {
      return;
    }
    if (error instanceof ApiError && error.status === 400) {
      await restoreFromServer(active.id, version);
      return;
    }
    tripActions.setSaveStatus("error", "保存失败，请稍后重试。");
  }
}

export function retryTripSave(): void {
  cancelScheduledTripSave();
  void flushTripSave();
}

async function restoreFromServer(tripId: number, version: number): Promise<void> {
  try {
    const detail = await request<Trip>(`/api/trips/${tripId}`);
    if (version !== requestVersion) {
      return;
    }
    tripActions.setActive(detail);
    tripActions.setSaveStatus("error", "服务端校验未通过，已恢复为服务端数据。");
  } catch {
    tripActions.setSaveStatus("error", "保存失败，且无法重新读取行程。");
  }
}
