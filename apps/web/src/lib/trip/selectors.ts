import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { petsQueryOptions } from "@/queries/pets";
import { resolvePolicySubjects, type PolicySubjects } from "./policy-subjects";
import { isTripEnded } from "./status";
import { tripStore } from "./store";
import type { DraftTrip, HydrationStatus, Trip, TripCity, TripSaveState } from "./types";

export function useActiveTrip(): Trip | null {
  return useSelector(tripStore, (state) => state.active);
}

export function useTripEditing(): boolean {
  return useSelector(tripStore, (state) => state.editing);
}

export function useActiveTripReadOnly(): boolean {
  const active = useActiveTrip();
  return active != null && isTripEnded(active);
}

export function useDraftTrip(): DraftTrip | null {
  return useSelector(tripStore, (state) => state.draft);
}

export function useTripCity(): TripCity | null {
  return useSelector(tripStore, (state) => state.cache.city);
}

export function useTripPet() {
  return useSelector(tripStore, (state) => {
    const petId = state.active?.petId;
    return petId == null ? null : (state.cache.pets[petId] ?? null);
  });
}

export function usePanelExpanded(): boolean {
  return useSelector(tripStore, (state) => state.panel.expanded);
}

export function useSaveStatus(): TripSaveState {
  return useSelector(tripStore, (state) => state.save);
}

export function useSaveRevision(): number {
  return useSelector(tripStore, (state) => state.saveRevision);
}

export function useHydrationStatus(): HydrationStatus {
  return useSelector(tripStore, (state) => state.hydration);
}

export function usePolicySubjects(): PolicySubjects {
  const active = useActiveTrip();
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });
  const status = petsQuery.isError
    ? "error"
    : petsQuery.isPending
      ? "loading"
      : "ready";
  return resolvePolicySubjects(active, petsQuery.data ?? [], status);
}
