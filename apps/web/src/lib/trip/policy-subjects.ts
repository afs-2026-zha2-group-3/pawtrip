import type { Pet } from "@/queries/pets";
import type { Trip } from "./types";

export type PetLoadStatus = "loading" | "error" | "ready";

export interface PolicySubjects {
  status: PetLoadStatus | "none";
  subjects: Pet[];
}

export function resolvePolicySubjects(
  active: Trip | null,
  pets: Pet[],
  petStatus: PetLoadStatus,
): PolicySubjects {
  if (petStatus === "error") {
    return { status: "error", subjects: [] };
  }
  if (petStatus === "loading") {
    return { status: "loading", subjects: [] };
  }
  if (active?.petId != null) {
    const pet = pets.find((candidate) => candidate.id === active.petId);
    return pet ? { status: "ready", subjects: [pet] } : { status: "loading", subjects: [] };
  }
  return pets.length > 0
    ? { status: "ready", subjects: pets }
    : { status: "none", subjects: [] };
}
