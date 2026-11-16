import { queryOptions } from "@tanstack/react-query";
import { request } from "../lib/http/request";
import type { DestinationCandidate } from "../lib/destination-matching";
import type { PetType } from "./pets";

export interface DestinationFilters {
  keyword?: string;
  petFriendly?: boolean;
  petType?: PetType | null;
  breedId?: number | null;
  shoulderHeightCm?: number | null;
}

export function destinationsQueryOptions(filters: DestinationFilters = {}) {
  const keyword = filters.keyword?.trim() ?? "";
  const petFriendly = filters.petFriendly ?? false;
  const petType = petFriendly ? (filters.petType ?? null) : null;
  const breedId = petType === "DOG" ? (filters.breedId ?? null) : null;
  const shoulderHeightCm = petFriendly ? (filters.shoulderHeightCm ?? null) : null;
  const params = new URLSearchParams();
  if (keyword) {
    params.set("keyword", keyword);
  }
  if (petFriendly) {
    params.set("petFriendly", "true");
  }
  if (petType) {
    params.set("petType", petType);
  }
  if (breedId != null) {
    params.set("breedId", String(breedId));
  }
  if (shoulderHeightCm != null) {
    params.set("shoulderHeightCm", String(shoulderHeightCm));
  }
  const query = params.toString();
  return queryOptions({
    queryKey: ["destinations", keyword, petFriendly, petType, breedId, shoulderHeightCm],
    queryFn: ({ signal }) =>
      request<DestinationCandidate[]>(`/api/destinations${query ? `?${query}` : ""}`, { signal }),
  });
}