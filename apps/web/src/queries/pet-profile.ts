import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export interface PetProfile {
  breed: string;
}

// 外部 US-01 change 尚未交付读取接口；endpoint 与响应形状为临时契约，
// 对方落地后仅改本 adapter（design D6）。任何失败/无档案一律退化为 null。
export async function fetchPetProfile(options: { signal?: AbortSignal } = {}): Promise<PetProfile | null> {
  try {
    const pets = await request<{ breed?: string | null }[]>("/api/pets", { signal: options.signal });
    const withBreed = pets.find((pet) => typeof pet.breed === "string" && pet.breed.length > 0);
    return withBreed?.breed ? { breed: withBreed.breed } : null;
  } catch {
    return null;
  }
}

export const petProfileQueryOptions = queryOptions({
  queryKey: ["pet-profile"],
  queryFn: ({ signal }) => fetchPetProfile({ signal }),
});