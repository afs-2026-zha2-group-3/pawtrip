import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { ApiError } from "../lib/http/api-error";
import { request } from "../lib/http/request";

export type PackingCategory =
  | "DOCUMENTS"
  | "FOOD"
  | "TRAVEL"
  | "HEALTH"
  | "CLEANING";

export type PackingSource = "TEMPLATE" | "CUSTOM";

export interface PackingItem {
  id: number;
  category: PackingCategory;
  name: string;
  quantity: number;
  checked: boolean;
  source: PackingSource;
  templateKey: string | null;
}

export interface PackingProgress {
  checked: number;
  total: number;
}

export interface PackingChecklist {
  tripId: number;
  transportMode: string | null;
  totalDays: number;
  createdAt: string;
  updatedAt: string;
  progress: PackingProgress;
  items: PackingItem[];
}

export interface CreatePackingItemInput {
  name: string;
  category: PackingCategory;
  quantity: number;
}

export interface UpdatePackingItemInput {
  name?: string;
  category?: PackingCategory;
  quantity?: number;
  checked?: boolean;
}

export const packingChecklistQueryKeys = {
  all: ["packing-checklist"] as const,
  detail: (tripId: number) => ["packing-checklist", tripId] as const,
};

export function packingChecklistQueryOptions(
  tripId: number,
  options: { enabled?: boolean } = {},
) {
  return queryOptions({
    queryKey: packingChecklistQueryKeys.detail(tripId),
    queryFn: async ({ signal }) => {
      try {
        return await request<PackingChecklist>(
          `/api/trips/${tripId}/packing-checklist`,
          { signal },
        );
      } catch (error) {
        // 未生成是正常状态，交给弹窗展示生成引导，不作为查询错误。
        if (
          error instanceof ApiError &&
          error.code === "PACKING_CHECKLIST_NOT_FOUND"
        ) {
          return null;
        }
        throw error;
      }
    },
    enabled: options.enabled ?? true,
    retry: false,
  });
}

export function generatePackingChecklist(tripId: number): Promise<PackingChecklist> {
  return request<PackingChecklist>(`/api/trips/${tripId}/packing-checklist`, {
    method: "POST",
  });
}

export function generatePackingChecklistMutationOptions(tripId: number) {
  return mutationOptions({
    mutationKey: [...packingChecklistQueryKeys.detail(tripId), "generate"],
    mutationFn: () => generatePackingChecklist(tripId),
  });
}

export function createPackingItem(
  tripId: number,
  input: CreatePackingItemInput,
): Promise<PackingItem> {
  return request<PackingItem>(`/api/trips/${tripId}/packing-checklist/items`, {
    method: "POST",
    body: input,
  });
}

export function createPackingItemMutationOptions(tripId: number) {
  return mutationOptions({
    mutationKey: [...packingChecklistQueryKeys.detail(tripId), "create-item"],
    mutationFn: (input: CreatePackingItemInput) => createPackingItem(tripId, input),
  });
}

export function updatePackingItem(
  tripId: number,
  itemId: number,
  input: UpdatePackingItemInput,
): Promise<PackingItem> {
  return request<PackingItem>(
    `/api/trips/${tripId}/packing-checklist/items/${itemId}`,
    { method: "PUT", body: input },
  );
}

export function updatePackingItemMutationOptions(tripId: number) {
  return mutationOptions({
    mutationKey: [...packingChecklistQueryKeys.detail(tripId), "update-item"],
    mutationFn: ({
      itemId,
      input,
    }: {
      itemId: number;
      input: UpdatePackingItemInput;
    }) => updatePackingItem(tripId, itemId, input),
  });
}

export function deletePackingItem(tripId: number, itemId: number): Promise<void> {
  return request<void>(
    `/api/trips/${tripId}/packing-checklist/items/${itemId}`,
    { method: "DELETE" },
  );
}

export function deletePackingItemMutationOptions(tripId: number) {
  return mutationOptions({
    mutationKey: [...packingChecklistQueryKeys.detail(tripId), "delete-item"],
    mutationFn: (itemId: number) => deletePackingItem(tripId, itemId),
  });
}

export function packingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "PET_PROFILE_REQUIRED") {
      return "请先创建宠物档案，再生成携带清单。";
    }
    return error.detail || "操作失败，请稍后重试。";
  }
  return "操作失败，请稍后重试。";
}
