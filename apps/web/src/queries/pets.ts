import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export type PetType = "CAT" | "DOG";

export interface Pet {
  id: number;
  name: string;
  petType: PetType;
  weightKg: number;
  shoulderHeightCm: number;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  photo: string | null;
}

export interface SavePetInput {
  name: string;
  petType: PetType;
  weightKg: number;
  shoulderHeightCm: number;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  photo: string | null;
}

export const petQueryKeys = {
  all: ["pets"] as const,
};

export function petsQueryOptions() {
  return queryOptions({
    queryKey: petQueryKeys.all,
    queryFn: ({ signal }) => request<Pet[]>("/api/pets", { signal }),
    staleTime: 60_000,
    retry: 1,
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
