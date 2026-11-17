import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { Pet, PetPersonality, PetPreference, PetType } from "./pets";

export interface PetProfile {
  petType: PetType;
  breedId: number | null;
  breedName: string | null;
  shoulderHeightCm: number | null;
  // REQ-014 个性化推荐字段（design D6）：旧数据/未填写退化为 [] 与 null
  preferences: PetPreference[];
  personality: PetPersonality | null;
}

// 需求方确认单宠口径：取第一只宠物；失败/无档案一律退化 null（design D6）
export async function fetchPetProfile(options: { signal?: AbortSignal } = {}): Promise<PetProfile | null> {
  try {
    const pets = await request<Pet[]>("/api/pets", { signal: options.signal });
    const pet = pets[0];
    if (!pet) {
      return null;
    }
    return {
      petType: pet.petType,
      breedId: pet.dogBreed?.id ?? null,
      breedName: pet.dogBreed?.name ?? null,
      shoulderHeightCm: pet.shoulderHeightCm ?? null,
      preferences: pet.preferences ?? [],
      personality: pet.personality ?? null,
    };
  } catch {
    return null;
  }
}

export const petProfileQueryOptions = queryOptions({
  queryKey: ["pet-profile"],
  queryFn: ({ signal }) => fetchPetProfile({ signal }),
});