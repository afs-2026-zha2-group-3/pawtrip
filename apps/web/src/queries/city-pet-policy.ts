import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";

export type CityPetPolicyMatch = {
  breedId: number;
  breedName: string;
  matched: boolean;
  allowed: boolean;
};

export type CityPetPolicySource = { title: string; note: string | null };

export type CityPetPolicy = {
  adcode: string;
  name: string;
  covered: boolean;
  areaScope: string | null;
  policies: string[];
  bannedBreeds: string[];
  allowedBreeds: string[];
  allowedPetTypes: string | null;
  source: CityPetPolicySource | null;
  updatedMonth: string | null;
  match: CityPetPolicyMatch | null;
};

export function cityPetPolicyQueryOptions(
  adcode: string,
  breedId: number | null,
) {
  const breedQuery = breedId === null ? "" : `?breedId=${breedId}`;
  return queryOptions({
    queryKey: ["city-pet-policy", adcode, breedId],
    queryFn: ({ signal }) =>
      request<CityPetPolicy>(
        `/api/cities/${encodeURIComponent(adcode)}/pet-policy${breedQuery}`,
        { signal },
      ),
  });
}
