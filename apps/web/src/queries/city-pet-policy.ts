import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export type CityPetPolicyMatch = { breed: string; matched: boolean };

export type CityPetPolicySource = { title: string; note: string | null };

export type CityPetPolicy = {
  adcode: string;
  name: string;
  covered: boolean;
  areaScope: string | null;
  policies: string[];
  bannedBreeds: string[];
  source: CityPetPolicySource | null;
  updatedMonth: string | null;
  match: CityPetPolicyMatch | null;
};

export function cityPetPolicyQueryOptions(adcode: string, breed: string | null) {
  const breedQuery = breed ? `?breed=${encodeURIComponent(breed)}` : "";
  return queryOptions({
    queryKey: ["city-pet-policy", adcode, breed],
    queryFn: ({ signal }) =>
      request<CityPetPolicy>(
        `/api/cities/${encodeURIComponent(adcode)}/pet-policy${breedQuery}`,
        { signal },
      ),
  });
}
