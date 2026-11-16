import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export interface PetProfile {
  breed: string;
}

// 外部 US-01 已交付 GET /api/pets，但 PetDetail 尚无 breed 字段；
// breed 契约补齐前一律退化为 null，补齐后仅改本 adapter（design D6）。
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