import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export type PetType = "CAT" | "DOG";

// REQ-014 词表（design D1，与后端 PetPreference/PetPersonality 枚举镜像）
export type PetPreference =
  | "SWIMMING"
  | "HIKING"
  | "GRASS_RUNNING"
  | "CITY_WALKING"
  | "SNOW_PLAY";

export type PetPersonality = "ENERGETIC" | "CALM" | "TIMID";

export interface DogBreed {
  id: number;
  name: string;
  officialAggressive: boolean;
}

export interface Pet {
  id: number;
  name: string;
  petType: PetType;
  weightKg: number;
  shoulderHeightCm: number;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  photo: string | null;
  dogBreed: DogBreed | null;
  preferences: PetPreference[];
  personality: PetPersonality | null;
}

export interface SavePetInput {
  name: string;
  petType: PetType;
  weightKg: number;
  shoulderHeightCm: number;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  photo: string | null;
  dogBreedId: number | null;
  preferences: PetPreference[];
  personality: PetPersonality | null;
}

export const petQueryKeys = {
  all: ["pets"] as const,
  dogBreeds: ["dog-breeds"] as const,
};

export function petsQueryOptions() {
  return queryOptions({
    queryKey: petQueryKeys.all,
    queryFn: ({ signal }) => request<Pet[]>("/api/pets", { signal }),
    staleTime: 60_000,
    retry: 1,
  });
}

export function dogBreedsQueryOptions() {
  return queryOptions({
    queryKey: petQueryKeys.dogBreeds,
    queryFn: ({ signal }) => request<DogBreed[]>("/api/dog-breeds", { signal }),
  });
}

export function createPet(input: SavePetInput): Promise<Pet> {
  return request<Pet>("/api/pets", { method: "POST", body: input });
}

export function createPetMutationOptions() {
  return mutationOptions({
    mutationKey: [...petQueryKeys.all, "create"],
    mutationFn: createPet,
  });
}

export function updatePet(id: number, input: SavePetInput): Promise<Pet> {
  return request<Pet>(`/api/pets/${id}`, { method: "PUT", body: input });
}

export function updatePetMutationOptions() {
  return mutationOptions({
    mutationKey: [...petQueryKeys.all, "update"],
    mutationFn: ({ id, input }: { id: number; input: SavePetInput }) =>
      updatePet(id, input),
  });
}

export function deletePet(id: number): Promise<void> {
  return request<void>(`/api/pets/${id}`, { method: "DELETE" });
}

export function deletePetMutationOptions() {
  return mutationOptions({
    mutationKey: [...petQueryKeys.all, "delete"],
    mutationFn: deletePet,
  });
}
