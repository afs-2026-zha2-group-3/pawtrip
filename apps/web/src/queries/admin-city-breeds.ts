import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export interface BreedOption {
  id: number;
  name: string;
  officialAggressive: boolean;
}

export interface CityAllowedBreeds {
  adcode: string;
  name: string;
  allowedBreedIds: number[];
  breeds: BreedOption[];
}

export const cityAllowedBreedsQueryKey = (adcode: string) =>
  ["admin-city-allowed-breeds", adcode] as const;

export function cityAllowedBreedsQueryOptions(adcode: string | null) {
  return queryOptions({
    queryKey: cityAllowedBreedsQueryKey(adcode ?? ""),
    queryFn: ({ signal }) =>
      request<CityAllowedBreeds>(
        `/api/admin/cities/${encodeURIComponent(adcode ?? "")}/allowed-breeds`,
        { signal },
      ),
    enabled: adcode !== null,
  });
}

export function updateCityAllowedBreeds(adcode: string, breedIds: number[]) {
  return request<CityAllowedBreeds>(
    `/api/admin/cities/${encodeURIComponent(adcode)}/allowed-breeds`,
    { method: "PUT", body: { breedIds } },
  );
}

export function updateCityAllowedBreedsMutationOptions() {
  return mutationOptions({
    mutationKey: ["admin-city-allowed-breeds", "update"],
    mutationFn: ({
      adcode,
      breedIds,
    }: {
      adcode: string;
      breedIds: number[];
    }) => updateCityAllowedBreeds(adcode, breedIds),
  });
}
