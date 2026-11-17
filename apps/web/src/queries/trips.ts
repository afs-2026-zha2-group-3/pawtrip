import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { SaveTripInput, Trip, TripPlan } from "../lib/trip/types";

export interface TripSummary {
  id: number;
  name: string;
  cityAdcode: string;
  petId: number;
  totalDays: number;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const tripQueryKeys = {
  all: ["trips"] as const,
  detail: (id: number) => ["trips", "detail", id] as const,
};

export function tripsQueryOptions() {
  return queryOptions({
    queryKey: tripQueryKeys.all,
    queryFn: ({ signal }) => request<TripSummary[]>("/api/trips", { signal }),
  });
}

export function tripDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: tripQueryKeys.detail(id),
    queryFn: ({ signal }) => request<Trip>(`/api/trips/${id}`, { signal }),
  });
}

export function createTrip(input: {
  name: string;
  cityAdcode: string;
  petId: number;
  totalDays: number;
  startDate?: string | null;
  plan: TripPlan;
}): Promise<Trip> {
  return request<Trip>("/api/trips", {
    method: "POST",
    body: {
      name: input.name,
      cityAdcode: input.cityAdcode,
      petId: input.petId,
      totalDays: input.totalDays,
      startDate: input.startDate ?? null,
      plan: input.plan,
    },
  });
}

export function updateTrip(id: number, input: SaveTripInput): Promise<Trip> {
  return request<Trip>(`/api/trips/${id}`, {
    method: "PUT",
    body: {
      name: input.name,
      totalDays: input.totalDays,
      startDate: input.startDate,
      plan: input.plan,
      transportMode: input.transportMode,
    },
  });
}

export function deleteTrip(id: number): Promise<void> {
  return request<void>(`/api/trips/${id}`, { method: "DELETE" });
}

export function fetchTripDetail(id: number): Promise<Trip> {
  return request<Trip>(`/api/trips/${id}`);
}
