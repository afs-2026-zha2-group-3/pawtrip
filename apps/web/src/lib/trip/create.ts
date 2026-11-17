import type { QueryClient } from "@tanstack/react-query";
import type { DestinationCandidate } from "@/lib/destination-matching";
import { createTrip, tripQueryKeys } from "@/queries/trips";
import { createEmptyPlan } from "./plan";
import { tripActions } from "./store";
import type { Trip } from "./types";

export interface CreateTripInput {
  name: string;
  cityAdcode: string;
  petId: number;
  totalDays: number;
  startDate?: string | null;
  city?: Pick<DestinationCandidate, "adcode" | "name" | "province">;
}

export async function createTripAndActivate(
  queryClient: QueryClient,
  input: CreateTripInput,
): Promise<Trip> {
  const trip = await createTrip({
    name: input.name,
    cityAdcode: input.cityAdcode,
    petId: input.petId,
    totalDays: input.totalDays,
    startDate: input.startDate,
    plan: createEmptyPlan(input.totalDays),
  });
  if (input.city) {
    tripActions.cacheCity({
      adcode: input.city.adcode,
      name: input.city.name,
      province: input.city.province,
    });
  }
  tripActions.setActive(trip);
  tripActions.setSaveStatus("saved");
  await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
  return trip;
}
